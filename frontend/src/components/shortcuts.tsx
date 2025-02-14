import { Checkbox, Flex, Text } from "@radix-ui/themes"

type TCheckboxCombinedProps = { checked: boolean, setChecked: (checked: boolean) => void, label: string }
export const CheckboxCombined = ({ checked, setChecked, label }: TCheckboxCombinedProps) => {
  return (
    <Flex gap='2' direction='row' align='center' asChild>
      <Text as='label'>
        <Checkbox checked={checked} onCheckedChange={setChecked} />
        {label}
      </Text>
    </Flex>
  )
}