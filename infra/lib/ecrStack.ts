import * as cdk from 'aws-cdk-lib'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'
import { accounts } from './accounts'
import { GITHUB_ACTIONS_OIDC_THUMBPRINT_LIST } from './githubActionsStack'

export class EcrStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CommonStackProps) {
    super(scope, id, props)

    const localDeveloperAssumer = new iam.PrincipalWithConditions(new iam.AccountPrincipal(props.env!.account!), {
      ArnLike: {
        'aws:PrincipalArn': [
          `arn:aws:iam::${props.env!.account!}:role/aws-reserved/sso.amazonaws.com/eu-west-1/AWSReservedSSO_AdministratorAccess_*`,
          `arn:aws:sts::${props.env!.account!}:assumed-role/AWSReservedSSO_AdministratorAccess_*/*`
        ]
      }
    })

    const ludosRepo = new ecr.Repository(this, 'LudosRepository', {
      repositoryName: 'ludos',
      imageTagMutability: ecr.TagMutability.IMMUTABLE
    })

    ludosRepo.grantPull(new iam.AccountPrincipal(accounts.dev.id))
    ludosRepo.grantPull(new iam.AccountPrincipal(accounts.qa.id))
    ludosRepo.grantPull(new iam.AccountPrincipal(accounts.prod.id))

    const githubActionsOidcProvider = new iam.CfnOIDCProvider(this, 'GhActionsIdentityProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIdList: ['sts.amazonaws.com'],
      thumbprintList: GITHUB_ACTIONS_OIDC_THUMBPRINT_LIST
    })

    const githubActionsPushRole = new iam.Role(this, 'GhActionsPushRole', {
      roleName: 'ludos-gh-actions-ecr-push-role',
      assumedBy: new iam.FederatedPrincipal(
        githubActionsOidcProvider.attrArn,
        {
          StringEquals: { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com' },
          StringLike: { 'token.actions.githubusercontent.com:sub': 'repo:Opetushallitus/ludos:*' }
        },
        'sts:AssumeRoleWithWebIdentity'
      )
    })

    ludosRepo.grantPullPush(githubActionsPushRole)

    const restrictedDeployRole = new iam.Role(this, 'RestrictedDeployRole', {
      roleName: 'ludos-restricted-ci-image-read-role',
      description:
        'Restricted read role for the CI permission lane. Assumed locally only via the AWS Identity Center AdministratorAccess role when simulating GitHub Actions image reads from the utility account.',
      assumedBy: localDeveloperAssumer
    })

    restrictedDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ecr:DescribeImages', 'ecr:ListImages'],
        resources: [ludosRepo.repositoryArn]
      })
    )
  }
}
