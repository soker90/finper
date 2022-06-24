import Option from './Option'

const OptionGroup = ({
  option,
  optionValue,
  optionLabel,
  childrenName
}: {
    option: any
    optionValue: string | number
    optionLabel: string | number
    childrenName: string
}) => (
    <optgroup key={option[optionValue]} label={option[optionLabel]}>
        {option[childrenName].map((child: any) => (
            <Option key={child[optionValue]} child={child} optionValue={optionValue} optionLabel={optionLabel} />
        ))}
    </optgroup>
)
export default OptionGroup
