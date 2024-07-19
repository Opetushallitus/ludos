import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'
import * as iam from 'aws-cdk-lib/aws-iam'

export const GITHUB_ACTIONS_OIDC_THUMBPRINT_LIST = [
  '6938fd4d98bab03faadb97b34396831e3780aea1',
  '1c58a3a8518e8759bf075b76b750d4f2df264fcd'
]

export class GithubActionsStack extends cdk.Stack {
  public githubActionsRole: iam.Role

  constructor(scope: Construct, id: string, props: CommonStackProps) {
    super(scope, id, props)

    const githubActionsOidcProvider = new iam.CfnOIDCProvider(this, 'GithubActionsIdentityProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIdList: ['sts.amazonaws.com'],
      thumbprintList: GITHUB_ACTIONS_OIDC_THUMBPRINT_LIST
    })

    this.githubActionsRole = new iam.Role(this, 'GithubActionsRole', {
      roleName: `ludos-github-actions-role-${props.envName}`,
      assumedBy: new iam.FederatedPrincipal(
        githubActionsOidcProvider.attrArn,
        {
          StringEquals: { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com' },
          StringLike: { 'token.actions.githubusercontent.com:sub': 'repo:Opetushallitus/ludos:*' }
        },
        'sts:AssumeRoleWithWebIdentity'
      )
    })
  }
}
