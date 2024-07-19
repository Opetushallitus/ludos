type AccountName = 'utility' | 'dev' | 'qa' | 'prod'
export type EnvName = 'utility' | 'untuva' | 'hahtuva' | 'qa' | 'prod'

export interface Account {
  name: AccountName
  id: string
  environments: EnvName[]
}

export const accounts: { [key in AccountName]: Account } = {
  utility: { name: 'utility', id: '505953557276', environments: ['utility'] },
  dev: { name: 'dev', id: '782034763554', environments: ['untuva', 'hahtuva'] },
  qa: { name: 'qa', id: '260185049060', environments: ['qa'] },
  prod: { name: 'prod', id: '072794607950', environments: ['prod'] }
}

export const getAccountByEnvName = (envName: EnvName): Account => {
  const matchingAccounts = Object.values(accounts).filter((a) => a.environments.includes(envName))

  if (matchingAccounts.length !== 1) {
    throw new Error(`Unexpected number of accounts match envName ${envName}: ${matchingAccounts.length}`)
  } else {
    return matchingAccounts[0]
  }
}

export const validateEnvName = getAccountByEnvName
