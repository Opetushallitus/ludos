import Select, {
  ClearIndicatorProps,
  components,
  DropdownIndicatorProps,
  GroupBase,
  MenuProps,
  MultiValueRemoveProps,
  OptionProps,
  Props
} from 'react-select'
import { Icon } from '../Icon'
import './ludosSelect.css'
import { useState } from 'react'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { Button } from '../Button'
import { FormError } from '../forms/formCommon/FormErrors'

export type LudosSelectOption = {
  value: string
  label: string
}

function isLudosSelectOption(option: any): option is LudosSelectOption {
  return 'value' in option && 'label' in option
}

type MenuSize = 'full' | 'md' | 'lg'

const sizeToClassMap: Record<MenuSize, string> = {
  full: 'dropdown-full',
  md: 'dropdown-md',
  lg: 'dropdown-lg'
}

export type LudosSelectProps<
  Option = LudosSelectOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
> = Props<Option, IsMulti, Group> & {
  transparentSelect?: boolean
  menuSize?: MenuSize
  error?: string
}

export function LudosSelect<
  Option = LudosSelectOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>({ menuSize = 'full', ...props }: LudosSelectProps<Option, IsMulti, Group>) {
  const { t } = useLudosTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const DropdownIndicator = (props: DropdownIndicatorProps<Option, boolean, GroupBase<Option>>) => (
    <components.DropdownIndicator {...props}>
      <Icon name="laajenna" color="text-black" dataTestId={`${props.selectProps.name}-open`} />
    </components.DropdownIndicator>
  )

  const ClearIndicator = (props: ClearIndicatorProps<Option, IsMulti, Group> | undefined) =>
    props ? (
      <components.ClearIndicator {...props}>
        <Icon name="sulje" color="text-black" dataTestId={`${props.selectProps.name}-reset-selected-options`} />
      </components.ClearIndicator>
    ) : null

  const Option = (props: OptionProps<Option, boolean, GroupBase<Option>>) =>
    isLudosSelectOption(props.data) ? (
      <components.Option {...props}>
        <span data-testid={`${props.selectProps.name}-option-${props.data.value}`}>{props.data.label}</span>
      </components.Option>
    ) : null

  const Menu = (props: MenuProps<Option, boolean, GroupBase<Option>>) => (
    <components.Menu {...props} className={`min-w-full ${sizeToClassMap[menuSize]}`}>
      {props.children}
      {props.isMulti && (
        <div className="mt-1 flex justify-end border-t border-gray-border p-2">
          <Button
            variant="buttonPrimary"
            onClick={() => setIsOpen(!isOpen)}
            data-testid={`${props.selectProps.name}-multi-select-ready-button`}
          >
            {t('button.valmis')}
          </Button>
        </div>
      )}
    </components.Menu>
  )

  const MultiValueRemove = (props: MultiValueRemoveProps<Option, boolean, GroupBase<Option>>) => (
    <components.MultiValueRemove {...props}>
      <span data-testid={`${props.selectProps.name}-remove-selected-option`}>
        <Icon customClass="pt-0.5" name="sulje" color="text-white" />
      </span>
    </components.MultiValueRemove>
  )

  return (
    <>
      <Select
        id={props.name}
        instanceId={props.name}
        inputId={`${props.name}-input`}
        classNamePrefix={props.transparentSelect ? 'ludos-transparent-select' : 'ludos-select'}
        classNames={{
          control: () => (props.error ? 'ludos-select-error' : '')
        }}
        closeMenuOnSelect={true}
        hideSelectedOptions={false}
        components={{ DropdownIndicator, Option, Menu, MultiValueRemove, ClearIndicator }}
        placeholder={t('filter.valitse')}
        menuIsOpen={isOpen}
        onMenuOpen={() => setIsOpen(true)}
        onMenuClose={() => setIsOpen(false)}
        isSearchable={false}
        noOptionsMessage={() => t('filter.ei-tuloksia')}
        {...props}
      />
      <FormError error={props.error} name={props.name || ''} />
    </>
  )
}
