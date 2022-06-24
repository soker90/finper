const Option = ({
  child,
  optionValue,
  optionLabel
}: {
    child: any
    optionValue: string | number
    optionLabel: string | number
}) => (
    <option key={child[optionValue]} value={child[optionValue]}>
        {child[optionLabel]}
    </option>
)

export default Option
