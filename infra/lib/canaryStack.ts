import * as path from 'node:path'
import * as cdk from 'aws-cdk-lib'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as synthetics from 'aws-cdk-lib/aws-synthetics'
import { Construct } from 'constructs'
import * as esbuild from 'esbuild'
import { CommonStackProps } from '../types'

const SYNTHETICS_NODEJS_PLAYWRIGHT_8_0 = new synthetics.Runtime(
  'syn-nodejs-playwright-8.0',
  synthetics.RuntimeFamily.NODEJS
)
const WEB_PAGE_MONITORING_CANARY_DIR = path.join(__dirname, '../canary/web-page-monitoring')
const WEB_PAGE_PATH = '/kirjaudu'

interface CanaryStackProps extends CommonStackProps {
  domain: string
  alarmSnsTopic: sns.Topic
}

export class CanaryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CanaryStackProps) {
    super(scope, id, props)

    const canary = this.createWebPageMonitoringCanary(props)
    this.createCanaryFailedAlarm(canary, props.alarmSnsTopic)
  }

  private createWebPageMonitoringCanary(props: CanaryStackProps) {
    return new synthetics.Canary(this, 'WebPageMonitoringCanary', {
      canaryName: `${props.envName}-web-page-monitoring`,
      runtime: SYNTHETICS_NODEJS_PLAYWRIGHT_8_0,
      test: synthetics.Test.custom({
        handler: 'index.handler',
        code: synthetics.Code.fromAsset(WEB_PAGE_MONITORING_CANARY_DIR, { bundling: bundleWithEsbuild() })
      }),
      environmentVariables: { WEB_PAGE_URL: `https://${props.domain}${WEB_PAGE_PATH}` },
      schedule: synthetics.Schedule.rate(cdk.Duration.minutes(5)),
      provisionedResourceCleanup: true,
      artifactsBucketLifecycleRules: [{ expiration: cdk.Duration.days(30) }]
    })
  }

  private createCanaryFailedAlarm(canary: synthetics.Canary, alarmSnsTopic: sns.Topic) {
    const alarmSnsAction = new cloudwatchActions.SnsAction(alarmSnsTopic)

    const canaryFailedAlarm = new cloudwatch.Alarm(this, 'WebPageMonitoringCanaryFailedAlarm', {
      alarmName: 'WebPageMonitoringCanaryFailedAlarm',
      metric: canary.metricSuccessPercent({ period: cdk.Duration.minutes(5) }),
      threshold: 100,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING
    })
    canaryFailedAlarm.addAlarmAction(alarmSnsAction)
    canaryFailedAlarm.addOkAction(alarmSnsAction)
  }
}

function bundleWithEsbuild(): cdk.BundlingOptions {
  return {
    image: cdk.DockerImage.fromRegistry('dummy'),
    local: {
      tryBundle(outputDir) {
        esbuild.buildSync({
          entryPoints: [path.join(WEB_PAGE_MONITORING_CANARY_DIR, 'index.ts')],
          outfile: path.join(outputDir, 'index.mjs'),
          bundle: true,
          platform: 'node',
          target: 'node22',
          format: 'esm',
          external: ['@aws/synthetics-playwright']
        })
        return true
      }
    }
  }
}
