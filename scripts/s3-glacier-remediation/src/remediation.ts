import {
  GetObjectCommand,
  GetObjectCommandOutput,
  HeadObjectCommand,
  ListObjectVersionsCommand,
  PutObjectCommand,
  RestoreObjectCommand,
  S3Client,
  S3ServiceException
} from '@aws-sdk/client-s3'
import { createHash } from 'node:crypto'
import { createReadStream, promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

export type RemediationEnv = 'untuva' | 'qa' | 'prod'

export type ManifestItemStatus =
  | 'discovered'
  | 'destination_missing'
  | 'source_delete_candidate'
  | 'restore_requested'
  | 'restore_available'
  | 'copied'
  | 'verified'
  | 'restore_failed'
  | 'copy_failed'
  | 'checksum_mismatch'

export type ManifestItemAction = 'copy_to_archive' | 'delete_source'

export type ManifestItem = {
  environment: RemediationEnv
  sourceBucket: string
  sourceKey: string
  sourceVersionId: string
  sourceLastModified: string
  sourceStorageClass: 'GLACIER'
  sourceETag: string | null
  sourceSizeBytes: number | null
  remediationAction: ManifestItemAction
  destinationBucket: string
  destinationKey: string
  destinationVersionId: string | null
  sourceSha256: string | null
  destinationSha256: string | null
  checksumMatches: boolean | null
  status: ManifestItemStatus
  error: string | null
  updatedAt: string
}

type Manifest = {
  schemaVersion: 1
  environment: RemediationEnv
  generatedAt: string
  updatedAt: string
  items: ManifestItem[]
}

type ManifestItemWithOptionalAction = Omit<ManifestItem, 'remediationAction'> & {
  remediationAction?: ManifestItemAction
}

export type S3VersionLike = {
  Key?: string
  VersionId?: string
  IsLatest?: boolean
  LastModified?: Date
  StorageClass?: string
  ETag?: string
  Size?: number
  IsDeleteMarker?: boolean
}

const cutoffDate = new Date('2026-04-21T00:00:00.000Z')
const region = 'eu-west-1'
const progressLogInterval = 100
const sourceDeleteCandidateKeys = new Set(['testfile_0', 'testfile_1', 'ludos_app_s3_client_initialization_test'])
const copyableStatuses = new Set<ManifestItemStatus>([
  'discovered',
  'destination_missing',
  'restore_requested',
  'restore_failed',
  'restore_available',
  'copy_failed'
])
const copiedArchiveObjectStatuses = new Set<ManifestItemStatus>(['copied', 'verified', 'checksum_mismatch'])

export function parseRemediationEnv(env: NodeJS.ProcessEnv): RemediationEnv {
  const value = env.LUDOS_S3_GLACIER_REMEDIATION_ENV
  if (!value) {
    throw new Error('LUDOS_S3_GLACIER_REMEDIATION_ENV is missing')
  }
  if (value !== 'untuva' && value !== 'qa' && value !== 'prod') {
    throw new Error(`Unsupported S3 Glacier remediation environment '${value}'`)
  }
  return value
}

export function sourceBucketsFor(env: RemediationEnv): string[] {
  return ['certificate', 'image', 'instruction'].map((bucketId) => `ludos-application-${bucketId}-bucket-${env}`)
}

export function archiveBucketFor(env: RemediationEnv): string {
  return `ludos-application-glacier-remediation-archive-${env}`
}

export function manifestKey(env: RemediationEnv): string {
  return `manifests/s3-glacier-remediation-${env}.json`
}

export function destinationKeyFor(sourceBucket: string, sourceKey: string, sourceVersionId: string): string {
  const encodedSourceKey = Buffer.from(sourceKey, 'utf8').toString('base64url')
  return `objects/${sourceBucket}/${encodedSourceKey}/${encodeURIComponent(sourceVersionId)}`
}

function manifestIdentity(item: Pick<ManifestItem, 'sourceBucket' | 'sourceKey' | 'sourceVersionId'>): string {
  return `${item.sourceBucket}\u0000${item.sourceKey}\u0000${item.sourceVersionId}`
}

function sourceObjectVersionUri(item: Pick<ManifestItem, 'sourceBucket' | 'sourceKey' | 'sourceVersionId'>): string {
  return `s3://${item.sourceBucket}/${item.sourceKey}?versionId=${encodeURIComponent(item.sourceVersionId)}`
}

function destinationObjectUri(item: Pick<ManifestItem, 'destinationBucket' | 'destinationKey'>): string {
  return `s3://${item.destinationBucket}/${item.destinationKey}`
}

function remediationActionFor(sourceKey: string): ManifestItemAction {
  return sourceDeleteCandidateKeys.has(sourceKey) ? 'delete_source' : 'copy_to_archive'
}

function initialStatusFor(remediationAction: ManifestItemAction): ManifestItemStatus {
  return remediationAction === 'delete_source' ? 'source_delete_candidate' : 'discovered'
}

export function filterRestorableVersions(
  environment: RemediationEnv,
  sourceBucket: string,
  versions: S3VersionLike[],
  olderThan: Date = cutoffDate,
  now: string = new Date().toISOString()
): ManifestItem[] {
  const destinationBucket = archiveBucketFor(environment)

  return versions
    .filter(
      (version) =>
        !version.IsDeleteMarker &&
        version.IsLatest === false &&
        version.StorageClass === 'GLACIER' &&
        version.LastModified !== undefined &&
        version.LastModified.getTime() < olderThan.getTime() &&
        version.Key !== undefined &&
        version.VersionId !== undefined
    )
    .map((version) => {
      const sourceKey = version.Key!
      const remediationAction = remediationActionFor(sourceKey)
      return {
        environment,
        sourceBucket,
        sourceKey,
        sourceVersionId: version.VersionId!,
        sourceLastModified: version.LastModified!.toISOString(),
        sourceStorageClass: 'GLACIER',
        sourceETag: version.ETag ?? null,
        sourceSizeBytes: version.Size ?? null,
        remediationAction,
        destinationBucket,
        destinationKey: destinationKeyFor(sourceBucket, sourceKey, version.VersionId!),
        destinationVersionId: null,
        sourceSha256: null,
        destinationSha256: null,
        checksumMatches: null,
        status: initialStatusFor(remediationAction),
        error: null,
        updatedAt: now
      }
    })
}

export function mergeDiscoveredItems(
  existingItems: ManifestItem[],
  discoveredItems: ManifestItem[],
  now: string = new Date().toISOString()
): ManifestItem[] {
  const existingByIdentity = new Map(
    existingItems.map((item) => {
      const normalized = normalizeManifestItemForSourceDeletionSafety(item)
      return [manifestIdentity(normalized), normalized]
    })
  )
  const merged = new Map<string, ManifestItem>()

  for (const item of discoveredItems) {
    const discovered = normalizeManifestItemForSourceDeletionSafety(item)
    const identity = manifestIdentity(discovered)
    const existing = existingByIdentity.get(identity)
    if (discovered.remediationAction === 'delete_source') {
      merged.set(identity, sourceDeleteCandidate({ ...(existing ?? discovered), ...discovered }, now))
      continue
    }
    merged.set(identity, existing ?? { ...discovered, updatedAt: now })
  }

  return Array.from(merged.values()).sort((a, b) => manifestIdentity(a).localeCompare(manifestIdentity(b)))
}

function normalizeManifestItemForSourceDeletionSafety(item: ManifestItem): ManifestItem {
  const manifestItem = item as ManifestItemWithOptionalAction
  const expectedAction = expectedRemediationAction(manifestItem)

  rejectUnsafeSourceDeleteOverride(manifestItem, expectedAction)
  return manifestItemWithExpectedAction(manifestItem, expectedAction)

  function expectedRemediationAction(item: ManifestItemWithOptionalAction): ManifestItemAction {
    return remediationActionFor(item.sourceKey)
  }

  function rejectUnsafeSourceDeleteOverride(
    item: ManifestItemWithOptionalAction,
    expectedAction: ManifestItemAction
  ): void {
    if (item.remediationAction === 'delete_source' && expectedAction !== 'delete_source') {
      throw new Error(
        `Manifest item ${sourceObjectVersionUri(item)} remediationAction ${item.remediationAction} does not match expected action ${expectedAction}`
      )
    }
  }

  function manifestItemWithExpectedAction(
    item: ManifestItemWithOptionalAction,
    expectedAction: ManifestItemAction
  ): ManifestItem {
    const trusted = { ...item, remediationAction: expectedAction }
    return expectedAction === 'delete_source'
      ? sourceDeleteCandidate(trusted, trusted.updatedAt)
      : trusted
  }
}

function emptyManifest(env: RemediationEnv, now = new Date().toISOString()): Manifest {
  return {
    schemaVersion: 1,
    environment: env,
    generatedAt: now,
    updatedAt: now,
    items: []
  }
}

function isNoSuchKey(error: unknown): boolean {
  return error instanceof S3ServiceException && (error.name === 'NoSuchKey' || error.$metadata.httpStatusCode === 404)
}

function isRestoreAlreadyInProgress(error: unknown): boolean {
  return error instanceof S3ServiceException && error.name === 'RestoreAlreadyInProgress'
}

function isObjectAlreadyRestored(error: unknown): boolean {
  return error instanceof S3ServiceException && error.name === 'ObjectAlreadyInActiveTierError'
}

function isRestoreAvailable(restoreHeader?: string): boolean {
  return restoreHeader?.includes('ongoing-request="false"') ?? false
}

async function responseBodyToReadable(body: unknown): Promise<Readable> {
  if (body instanceof Readable) {
    return body
  }
  if (body instanceof Uint8Array) {
    return Readable.from(body)
  }
  if (typeof body === 'string') {
    return Readable.from(Buffer.from(body))
  }
  const sdkBody = body as { transformToByteArray?: () => Promise<Uint8Array> } | undefined
  if (sdkBody?.transformToByteArray) {
    return Readable.from(Buffer.from(await sdkBody.transformToByteArray()))
  }
  throw new Error('Unsupported S3 response body type')
}

async function responseBodyToString(body: unknown): Promise<string> {
  const readable = await responseBodyToReadable(body)
  const chunks: Buffer[] = []
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  await pipeline(createReadStream(filePath), hash)
  return hash.digest('hex')
}

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await fs.mkdtemp(path.join(tmpdir(), 'ludos-s3-glacier-remediation-'))
  try {
    return await fn(dir)
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
}

type RemediationContext = {
  env: RemediationEnv
  s3: S3Client
  archiveBucket: string
  manifestObjectKey: string
  sourceBuckets: string[]
}

function remediationContext(env: RemediationEnv, s3: S3Client = new S3Client({ region })): RemediationContext {
  return {
    env,
    s3,
    archiveBucket: archiveBucketFor(env),
    manifestObjectKey: manifestKey(env),
    sourceBuckets: sourceBucketsFor(env)
  }
}

export async function runCommand(
  env: RemediationEnv,
  command: string,
  s3: S3Client = new S3Client({ region })
): Promise<void> {
  const context = remediationContext(env, s3)

  switch (command) {
    case 'discover':
      await discoverWithContext(context)
      return
    case 'copy':
      await copyWithContext(context)
      return
    case 'verify':
      await verifyWithContext(context)
      return
    default:
      throw new Error("Expected command to be one of: discover, copy, verify")
  }
}

export async function discover(env: RemediationEnv, s3: S3Client = new S3Client({ region })): Promise<Manifest> {
  return discoverWithContext(remediationContext(env, s3))
}

export async function copy(env: RemediationEnv, s3: S3Client = new S3Client({ region })): Promise<Manifest> {
  return copyWithContext(remediationContext(env, s3))
}

export async function verify(env: RemediationEnv, s3: S3Client = new S3Client({ region })): Promise<Manifest> {
  return verifyWithContext(remediationContext(env, s3))
}

async function discoverWithContext(context: RemediationContext): Promise<Manifest> {
  logProgress(context, `discover: loading manifest s3://${context.archiveBucket}/${context.manifestObjectKey}`)
  const manifest = await loadManifest(context)
  logProgress(context, `discover: loaded manifest with ${manifest.items.length} existing items`)
  const discovered: ManifestItem[] = []

  for (const sourceBucket of context.sourceBuckets) {
    let keyMarker: string | undefined
    let versionIdMarker: string | undefined
    let page = 0
    let bucketDiscovered = 0
    logProgress(context, `discover: listing source bucket ${sourceBucket}`)
    do {
      page += 1
      const response = await context.s3.send(
        new ListObjectVersionsCommand({
          Bucket: sourceBucket,
          KeyMarker: keyMarker,
          VersionIdMarker: versionIdMarker
        })
      )
      const pageDiscovered = filterRestorableVersions(context.env, sourceBucket, response.Versions ?? [])
      bucketDiscovered += pageDiscovered.length
      discovered.push(...pageDiscovered)
      logProgress(
        context,
        `discover: listed page ${page} from ${sourceBucket}; ${pageDiscovered.length} matching versions on page, ${bucketDiscovered} matching versions in bucket`
      )
      keyMarker = response.NextKeyMarker
      versionIdMarker = response.NextVersionIdMarker
    } while (keyMarker !== undefined || versionIdMarker !== undefined)
    logProgress(context, `discover: completed source bucket ${sourceBucket}; ${bucketDiscovered} matching versions`)
  }

  const now = new Date().toISOString()
  const mergedItems = mergeDiscoveredItems(manifest.items, discovered, now)
  const archiveCopyItemCount = mergedItems.filter((item) => item.remediationAction === 'copy_to_archive').length
  const sourceDeleteCandidateCount = mergedItems.length - archiveCopyItemCount
  logProgress(
    context,
    `discover: checking destination archive objects for ${archiveCopyItemCount} archive-copy manifest items; ${sourceDeleteCandidateCount} source-delete candidates do not require archive destinations`
  )
  const items = await verifyDestinationObjects(context, mergedItems, now)
  const updated = {
    ...manifest,
    items,
    updatedAt: now
  }
  logProgress(context, `discover: saving manifest with ${items.length} items to s3://${context.archiveBucket}/${context.manifestObjectKey}`)
  await saveManifest(context, updated)
  logSummary(context, 'discover', updated)
  return updated
}

async function copyWithContext(context: RemediationContext): Promise<Manifest> {
  logProgress(context, `copy: loading manifest s3://${context.archiveBucket}/${context.manifestObjectKey}`)
  const manifest = await loadManifest(context)
  const now = new Date().toISOString()
  const items: ManifestItem[] = []
  const archiveCopyItemsTotal = manifest.items.filter((item) => item.remediationAction === 'copy_to_archive').length
  const sourceDeleteCandidateCount = manifest.items.length - archiveCopyItemsTotal
  let archiveItemNumber = 0
  logProgress(
    context,
    `copy: loaded manifest with ${manifest.items.length} items; ${archiveCopyItemsTotal} archive-copy items to inspect; ${sourceDeleteCandidateCount} source-delete candidates to skip`
  )

  for (const item of manifest.items) {
    if (item.remediationAction === 'delete_source') {
      logProgress(context, `copy: skipping source-delete candidate ${sourceObjectVersionUri(item)}`)
      items.push(sourceDeleteCandidate(item, now))
      continue
    }

    archiveItemNumber += 1
    if (!copyableStatuses.has(item.status)) {
      if (shouldLogItemProgress(archiveItemNumber, archiveCopyItemsTotal)) {
        logProgress(
          context,
          `copy: skipping item ${archiveItemNumber}/${archiveCopyItemsTotal} with status ${item.status}: ${sourceObjectVersionUri(item)}`
        )
      }
      items.push(item)
      continue
    }

    try {
      logProgress(
        context,
        `copy: processing item ${archiveItemNumber}/${archiveCopyItemsTotal}: ${sourceObjectVersionUri(item)} -> ${destinationObjectUri(item)}`
      )
      const sourceRestoreStatus = await requestSourceRestoreIfNeeded(
        context,
        item,
        now,
        archiveItemNumber,
        archiveCopyItemsTotal
      )
      if (sourceRestoreStatus) {
        items.push(sourceRestoreStatus)
        continue
      }

      const copied = await withTempDir(async (dir) => {
        const sourcePath = path.join(dir, 'source-object')
        logProgress(
          context,
          `copy: downloading source object for item ${archiveItemNumber}/${archiveCopyItemsTotal}: ${sourceObjectVersionUri(item)}`
        )
        const sourceObject = await downloadObject(context, item.sourceBucket, item.sourceKey, item.sourceVersionId, sourcePath)
        const sourceSha256 = await sha256File(sourcePath)
        logProgress(context, `copy: source SHA-256 for item ${archiveItemNumber}/${archiveCopyItemsTotal}: ${sourceSha256}`)
        const stat = await fs.stat(sourcePath)
        logProgress(
          context,
          `copy: uploading archive object for item ${archiveItemNumber}/${archiveCopyItemsTotal}: ${destinationObjectUri(item)}`
        )
        const upload = await context.s3.send(
          new PutObjectCommand({
            Bucket: item.destinationBucket,
            Key: item.destinationKey,
            Body: createReadStream(sourcePath),
            ContentLength: stat.size,
            StorageClass: 'GLACIER_IR',
            CacheControl: sourceObject.CacheControl,
            ContentDisposition: sourceObject.ContentDisposition,
            ContentEncoding: sourceObject.ContentEncoding,
            ContentLanguage: sourceObject.ContentLanguage,
            ContentType: sourceObject.ContentType,
            Expires: sourceObject.Expires,
            Metadata: {
              ...(sourceObject.Metadata ?? {}),
              sourcebucket: item.sourceBucket,
              sourcekeybase64url: Buffer.from(item.sourceKey, 'utf8').toString('base64url'),
              sourceversionid: item.sourceVersionId,
              sourcelastmodified: item.sourceLastModified,
              sourcestorageclass: item.sourceStorageClass
            }
          })
        )
        logProgress(
          context,
          `copy: copied item ${archiveItemNumber}/${archiveCopyItemsTotal} to archive version ${upload.VersionId ?? '(unversioned)'}`
        )

        return {
          ...item,
          destinationVersionId: upload.VersionId ?? null,
          sourceSha256,
          status: 'copied' as const,
          error: null,
          updatedAt: now
        }
      })
      items.push(copied)
    } catch (error) {
      logProgress(
        context,
        `copy: failed item ${archiveItemNumber}/${archiveCopyItemsTotal}: ${sourceObjectVersionUri(item)}: ${String(error)}`
      )
      items.push({ ...item, status: 'copy_failed', error: String(error), updatedAt: now })
    }
  }

  const updated = { ...manifest, items, updatedAt: now }
  logProgress(
    context,
    `copy: saving manifest with ${items.length} items to s3://${context.archiveBucket}/${context.manifestObjectKey}`
  )
  await saveManifest(context, updated)
  logSummary(context, 'copy', updated)
  return updated
}

async function requestSourceRestoreIfNeeded(
  context: RemediationContext,
  item: ManifestItem,
  now: string,
  itemNumber: number,
  totalItems: number
): Promise<ManifestItem | null> {
  try {
    logProgress(
      context,
      `copy: checking source restore availability for item ${itemNumber}/${totalItems}: ${sourceObjectVersionUri(item)}`
    )
    const head = await context.s3.send(
      new HeadObjectCommand({
        Bucket: item.sourceBucket,
        Key: item.sourceKey,
        VersionId: item.sourceVersionId
      })
    )
    if (isRestoreAvailable(head.Restore)) {
      logProgress(context, `copy: source restore is available for item ${itemNumber}/${totalItems}`)
      return null
    }

    logProgress(
      context,
      `copy: requesting source restore for item ${itemNumber}/${totalItems}: ${sourceObjectVersionUri(item)}`
    )
    await context.s3.send(
      new RestoreObjectCommand({
        Bucket: item.sourceBucket,
        Key: item.sourceKey,
        VersionId: item.sourceVersionId,
        RestoreRequest: {
          Days: 7,
          GlacierJobParameters: {
            Tier: 'Standard'
          }
        }
      })
    )
    logProgress(context, `copy: source restore requested for item ${itemNumber}/${totalItems}`)
    return { ...item, status: 'restore_requested', error: null, updatedAt: now }
  } catch (error) {
    if (isRestoreAlreadyInProgress(error)) {
      logProgress(context, `copy: source restore already in progress for item ${itemNumber}/${totalItems}`)
      return { ...item, status: 'restore_requested', error: null, updatedAt: now }
    }
    if (isObjectAlreadyRestored(error)) {
      logProgress(context, `copy: source object is already restored for item ${itemNumber}/${totalItems}`)
      return null
    }
    logProgress(context, `copy: source restore failed for item ${itemNumber}/${totalItems}: ${String(error)}`)
    return { ...item, status: 'restore_failed', error: String(error), updatedAt: now }
  }
}

async function verifyWithContext(context: RemediationContext): Promise<Manifest> {
  const manifest = await loadManifest(context)
  const now = new Date().toISOString()
  const items: ManifestItem[] = []

  for (const item of manifest.items) {
    if (item.status !== 'copied' && item.status !== 'checksum_mismatch') {
      items.push(item)
      continue
    }
    if (!item.sourceSha256) {
      items.push({ ...item, status: 'copy_failed', error: 'Missing sourceSha256', updatedAt: now })
      continue
    }

    try {
      const verified = await withTempDir(async (dir) => {
        const destinationPath = path.join(dir, 'destination-object')
        await downloadObject(context, item.destinationBucket, item.destinationKey, item.destinationVersionId, destinationPath)
        const destinationSha256 = await sha256File(destinationPath)
        const checksumMatches = item.sourceSha256 === destinationSha256

        return {
          ...item,
          destinationSha256,
          checksumMatches,
          status: checksumMatches ? ('verified' as const) : ('checksum_mismatch' as const),
          error: checksumMatches ? null : 'Source and destination SHA-256 checksums differ',
          updatedAt: now
        }
      })
      items.push(verified)
    } catch (error) {
      items.push(isNoSuchKey(error) ? destinationMissing(item, now) : { ...item, status: 'checksum_mismatch', error: String(error), updatedAt: now })
    }
  }

  const updated = { ...manifest, items, updatedAt: now }
  await saveManifest(context, updated)
  logVerifySummary(context, updated)
  const mismatch = updated.items.find((item) => item.status === 'checksum_mismatch')
  if (mismatch) {
    throw new Error(`Checksum verification failed for ${mismatch.sourceBucket}/${mismatch.sourceKey}`)
  }
  const incomplete = updated.items.filter(
    (item) => item.remediationAction === 'copy_to_archive' && (item.status !== 'verified' || item.checksumMatches !== true)
  )
  if (incomplete.length > 0) {
    const noun = incomplete.length === 1 ? 'item is' : 'items are'
    throw new Error(`Remediation incomplete: ${incomplete.length} archive copy ${noun} not verified`)
  }
  const notReadyForSourceDeletion = updated.items
    .map((item) => ({ item, error: sourceDeletionReadinessError(context, item) }))
    .find((result) => result.error !== null)
  if (notReadyForSourceDeletion) {
    throw new Error(
      `Manifest item not ready for source deletion: ${sourceObjectVersionUri(notReadyForSourceDeletion.item)}: ${notReadyForSourceDeletion.error}`
    )
  }
  return updated
}

function sourceDeletionReadinessError(context: RemediationContext, item: ManifestItem): string | null {
  const expectedAction = remediationActionFor(item.sourceKey)
  if (item.remediationAction !== expectedAction) {
    return `remediationAction ${item.remediationAction} does not match expected action ${expectedAction}`
  }
  if (item.environment !== context.env) {
    return `environment ${item.environment} does not match ${context.env}`
  }
  if (!context.sourceBuckets.includes(item.sourceBucket)) {
    return `source bucket ${item.sourceBucket} is not one of the configured ${context.env} source buckets`
  }
  if (!item.sourceVersionId) {
    return 'sourceVersionId is missing'
  }

  if (item.remediationAction === 'delete_source') {
    if (!sourceDeleteCandidateKeys.has(item.sourceKey)) {
      return `source key ${item.sourceKey} is not an allowed source-delete candidate`
    }
    if (item.status !== 'source_delete_candidate') {
      return `delete-source candidate status is ${item.status}, expected source_delete_candidate`
    }
    return null
  }

  if (item.destinationBucket !== context.archiveBucket) {
    return `destination bucket ${item.destinationBucket} does not match ${context.archiveBucket}`
  }
  const expectedDestinationKey = destinationKeyFor(item.sourceBucket, item.sourceKey, item.sourceVersionId)
  if (item.destinationKey !== expectedDestinationKey) {
    return `destination key ${item.destinationKey} does not match ${expectedDestinationKey}`
  }
  if (item.destinationVersionId === null) {
    return 'destinationVersionId is missing'
  }
  if (item.status !== 'verified') {
    return `status is ${item.status}, expected verified`
  }
  if (item.checksumMatches !== true) {
    return `checksumMatches is ${item.checksumMatches}, expected true`
  }
  if (!item.sourceSha256) {
    return 'sourceSha256 is missing'
  }
  if (!item.destinationSha256) {
    return 'destinationSha256 is missing'
  }
  if (item.sourceSha256 !== item.destinationSha256) {
    return 'sourceSha256 and destinationSha256 differ'
  }
  return null
}

async function verifyDestinationObjects(
  context: RemediationContext,
  items: ManifestItem[],
  now: string
): Promise<ManifestItem[]> {
  const verified: ManifestItem[] = []
  const archiveItemsTotal = items.filter((item) => item.remediationAction === 'copy_to_archive').length
  let archiveItemNumber = 0

  for (const item of items) {
    if (item.remediationAction === 'delete_source') {
      verified.push(sourceDeleteCandidate(item, now))
      continue
    }

    archiveItemNumber += 1
    if (shouldLogItemProgress(archiveItemNumber, archiveItemsTotal)) {
      logProgress(
        context,
        `discover: checking destination archive object ${archiveItemNumber}/${archiveItemsTotal}: s3://${item.destinationBucket}/${item.destinationKey}`
      )
    }
    try {
      const head = await context.s3.send(
        new HeadObjectCommand({
          Bucket: item.destinationBucket,
          Key: item.destinationKey,
          VersionId: item.destinationVersionId ?? undefined
        })
      )
      verified.push({
        ...item,
        destinationVersionId: item.destinationVersionId ?? head.VersionId ?? null,
        status: item.status === 'destination_missing' ? 'discovered' : item.status,
        error: item.status === 'destination_missing' ? null : item.error,
        updatedAt: item.status === 'destination_missing' ? now : item.updatedAt
      })
    } catch (error) {
      if (isNoSuchKey(error)) {
        verified.push(destinationMissing(item, now))
        continue
      }
      verified.push({ ...item, error: `Could not verify destination object: ${String(error)}`, updatedAt: now })
    }
  }

  return verified
}

function sourceDeleteCandidate(item: ManifestItem, now: string): ManifestItem {
  return {
    ...item,
    remediationAction: 'delete_source',
    destinationVersionId: null,
    sourceSha256: null,
    destinationSha256: null,
    checksumMatches: null,
    status: 'source_delete_candidate',
    error: null,
    updatedAt: now
  }
}

function destinationMissing(item: ManifestItem, now: string): ManifestItem {
  return {
    ...item,
    destinationVersionId: null,
    destinationSha256: null,
    checksumMatches: false,
    status: 'destination_missing',
    error: 'Destination object does not exist',
    updatedAt: now
  }
}

async function loadManifest(context: RemediationContext): Promise<Manifest> {
  try {
    const response = await context.s3.send(
      new GetObjectCommand({ Bucket: context.archiveBucket, Key: context.manifestObjectKey })
    )
    const manifest = JSON.parse(await responseBodyToString(response.Body)) as Manifest
    return {
      ...manifest,
      items: manifest.items.map(normalizeManifestItemForSourceDeletionSafety)
    }
  } catch (error) {
    if (isNoSuchKey(error)) {
      return emptyManifest(context.env)
    }
    throw error
  }
}

async function saveManifest(context: RemediationContext, manifest: Manifest): Promise<void> {
  await context.s3.send(
    new PutObjectCommand({
      Bucket: context.archiveBucket,
      Key: context.manifestObjectKey,
      Body: JSON.stringify(manifest, null, 2),
      ContentType: 'application/json',
      StorageClass: 'STANDARD'
    })
  )
}

async function downloadObject(
  context: RemediationContext,
  bucket: string,
  key: string,
  versionId: string | null,
  destinationPath: string
): Promise<GetObjectCommandOutput> {
  const response = await context.s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      VersionId: versionId ?? undefined
    })
  )
  const fileHandle = await fs.open(destinationPath, 'w')
  await pipeline(await responseBodyToReadable(response.Body), fileHandle.createWriteStream())
  return response
}

function logSummary(context: RemediationContext, phase: string, manifest: Manifest): void {
  console.log(`${phase} complete for ${context.env}: ${JSON.stringify(statusCounts(manifest.items))}`)
}

function logVerifySummary(context: RemediationContext, manifest: Manifest): void {
  const counts = statusCounts(manifest.items)
  const archiveCopyItems = manifest.items.filter((item) => item.remediationAction === 'copy_to_archive')
  const archiveObjectsCopied = archiveCopyItems.filter(
    (item) => item.destinationVersionId !== null || copiedArchiveObjectStatuses.has(item.status)
  ).length
  const checksumSucceeded = archiveCopyItems.filter(
    (item) => item.status === 'verified' && item.checksumMatches === true
  ).length
  const checksumFailed = archiveCopyItems.filter((item) => item.status === 'checksum_mismatch').length
  const checksumPending = archiveCopyItems.filter((item) => item.status === 'copied').length
  const notCopiedYet = archiveCopyItems.length - archiveObjectsCopied
  const sourceDeleteCandidateCount = manifest.items.filter((item) => item.remediationAction === 'delete_source').length

  logProgress(context, `verify summary for ${context.env}`)
  logProgress(context, `  manifest items: ${manifest.items.length}`)
  logProgress(context, `  archive copy target files: ${archiveCopyItems.length}`)
  logProgress(context, `  archive objects copied: ${archiveObjectsCopied}/${archiveCopyItems.length}`)
  logProgress(context, `  checksums: ${checksumSucceeded} succeeded, ${checksumFailed} failed, ${checksumPending} pending`)
  logProgress(context, `  not copied yet: ${notCopiedYet}`)
  logProgress(context, `  source delete candidates: ${sourceDeleteCandidateCount}`)
  logProgress(
    context,
    `  blocked states: restore_failed=${counts.restore_failed ?? 0}, copy_failed=${counts.copy_failed ?? 0}, checksum_mismatch=${counts.checksum_mismatch ?? 0}`
  )
  logProgress(context, `  status counts: ${JSON.stringify(counts)}`)
}

function statusCounts(items: ManifestItem[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1
    return acc
  }, {})
}

function logProgress(context: RemediationContext, message: string): void {
  console.log(`[${context.env}] ${message}`)
}

function shouldLogItemProgress(itemNumber: number, totalItems: number): boolean {
  return itemNumber === 1 || itemNumber === totalItems || itemNumber % progressLogInterval === 0
}
