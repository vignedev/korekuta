import { Callout, Flex, Select, Spinner } from '@radix-ui/themes'
import {
  Chart as ChartJS,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  TimeScale, LinearScale,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useEntries, useEntryData, useEntryRange } from '../libs/api'
import { memo, useState } from 'react'
import 'chartjs-adapter-date-fns'

ChartJS.register(
  PointElement,
  LineElement,
  Title,
  Tooltip,
  TimeScale, LinearScale,
  Filler
)

const Chart = memo(({ name }: { name: string }) => {
  const range = useEntryRange(name)
  const data = useEntryData(name)

  if (range.isPending || data.isPending) return <Spinner />
  if (range.error || data.error) return (
    <Callout.Root color='red'>
      <Callout.Icon>!</Callout.Icon>
      <Callout.Text>{data.error?.toString()} {range.error?.toString()}</Callout.Text>
    </Callout.Root>
  )

  return <Line options={{
    scales: {
      x: {
        type: 'time'
      },
      y: {
        min: range.data.min!,
        max: range.data.max!,

      }
    },
    animation: false
  }} data={{
    datasets: [
      {
        label: name,
        data: data.data.map(({ timestamp, value }) => ({ x: timestamp, y: value })),
        pointStyle: 'circle',
        borderColor: '#000',
        backgroundColor: '#000b',
        fill: true,
        stepped: true
      }
    ]
  }} />
})

export const ChartListing = () => {
  const entries = useEntries()
  const [entryName, setEntry] = useState<string>()

  return (
    <Flex direction='column' gap='2'>
      <Select.Root value={entryName} onValueChange={setEntry}>
        <Select.Trigger disabled={entries.isPending || !!entries.error} />
        <Select.Content>
          {
            (!entries.isPending && !entries.error) ? entries.data.map((name) => (
              <Select.Item value={name} key={name}>{name}</Select.Item>
            )) : null
          }
        </Select.Content>
      </Select.Root>

      {entryName && <Chart name={entryName} />}
    </Flex>
  )
}
export default ChartListing