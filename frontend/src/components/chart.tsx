import { Box, Callout, DataList, Flex, Select, Spinner, IconButton, AlertDialog, Code, Button, Checkbox, Text, Separator } from '@radix-ui/themes'
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
import { DataEntry, useEntries, useEntryData, useEntryRange } from '../libs/api'
import { memo, useState } from 'react'
import 'chartjs-adapter-date-fns'
import { ReloadIcon, TrashIcon } from '@radix-ui/react-icons'
import { fetcher } from '../libs/utils'
import { useQueryClient } from '@tanstack/react-query'
import { CheckboxCombined } from './shortcuts'

ChartJS.register(
  PointElement,
  LineElement,
  Title,
  Tooltip,
  TimeScale, LinearScale,
  Filler
)

type TChartDataViewProps = { relative: boolean, data: DataEntry[], last_ms?: number }
const ChartDataView = memo(({ data, last_ms, relative }: TChartDataViewProps) => {
  const last = data.at(-1)
  let
    min = null,
    max = null,
    sum = 0,
    count = 0

  const reference_time = relative ? Date.now() : last?.timestamp || 0

  for (const item of data) {
    if (item.timestamp <= (last_ms ? reference_time - last_ms : 0)) continue

    min = (min == null) ? item.value : Math.min(item.value, min)
    max = (max == null) ? item.value : Math.max(item.value, max)
    sum += item.value
    ++count
  }

  return (
    <DataList.Root orientation='vertical'>
      <DataList.Item>
        <DataList.Label>Minimum</DataList.Label>
        <DataList.Value>{min}</DataList.Value>
      </DataList.Item>
      <DataList.Item>
        <DataList.Label>Maximum</DataList.Label>
        <DataList.Value>{max}</DataList.Value>
      </DataList.Item>
      <DataList.Item>
        <DataList.Label>Average</DataList.Label>
        <DataList.Value>{count && (sum / count).toFixed(4)}</DataList.Value>
      </DataList.Item>
      <DataList.Item>
        <DataList.Label>Last Value</DataList.Label>
        <DataList.Value>{last?.value}</DataList.Value>
      </DataList.Item>
      <DataList.Item>
        <DataList.Label>Last Update</DataList.Label>
        <DataList.Value>{last && new Date(last.timestamp).toLocaleString()}</DataList.Value>
      </DataList.Item>
    </DataList.Root>
  )
})

type TChartProps = { relative: boolean, name: string, last_ms?: number, updateRate?: number }
const Chart = memo(({ relative, name, last_ms, updateRate }: TChartProps) => {
  const [stepped, setStepped] = useState(true)
  const [pointRadius, setPointRadius] = useState(0)

  const range = useEntryRange(name)
  const data = useEntryData(name, null, updateRate)

  if (range.isPending || data.isPending) return <Spinner />
  if (range.error || data.error) return (
    <Callout.Root color='red'>
      <Callout.Icon>!</Callout.Icon>
      <Callout.Text>{data.error?.toString()} {range.error?.toString()}</Callout.Text>
    </Callout.Root>
  )

  return <Flex gap='1'>
    <Flex gap='2' direction='column'>
      <ChartDataView relative={relative} data={data.data} last_ms={last_ms} />

      <Box asChild width='100%'><Separator/></Box>
      <CheckboxCombined checked={stepped} label='Stepped chart' setChecked={setStepped}/>
      <CheckboxCombined checked={pointRadius == 4} label='Points' setChecked={checked => setPointRadius(checked ? 4 : 0)}/>
    </Flex>

    <Box width='100%'>
      <Line options={{
        scales: {
          x: {
            type: 'time',
            min: last_ms ? ((relative ? Date.now() : data.data.at(-1)?.timestamp || 0) - last_ms) : undefined,
            grid: { 
              color: '#8882'
            }
          },
          y: {
            min: range.data.min!,
            max: range.data.max!,
            grid: { 
              color: '#8882'
            }
          }
        },
        animation: false
      }} data={{
        datasets: [
          {
            label: name,
            data: data.data.map(({ timestamp, value }) => ({ x: timestamp, y: value })),
            pointStyle: 'circle',
            pointHitRadius: 4,
            pointRadius: pointRadius,
            borderColor: '#fa2',
            backgroundColor: '#fa28',
            fill: true,
            stepped: stepped
          }
        ]
      }} />
    </Box>
  </Flex>
})

export const ChartListing = () => {
  const queryClient = useQueryClient()
  const entries = useEntries()
  const [entryName, setEntry] = useState<string>()

  const [relative, setRelative] = useState(false)
  const [lastMs, setLastMs] = useState<number>(60_000 * 15)
  const [updateRate, setUpdateRate] = useState<number>(1000)

  return (
    <Flex direction='column' gap='2'>
      <Flex direction='row' gap='2'>
        <IconButton variant='outline' onClick={() => queryClient.invalidateQueries({ queryKey: [ 'entries' ]})}>
          <ReloadIcon/>
        </IconButton>

        <Select.Root value={entryName} onValueChange={setEntry}>
          <Box asChild flexGrow='1'>
            <Select.Trigger disabled={entries.isPending || !!entries.error} placeholder='Select dataset' />
          </Box>
          <Select.Content>
            {
              (!entries.isPending && !entries.error) ? entries.data.map((name) => (
                <Select.Item value={name} key={name}>{name}</Select.Item>
              )) : null
            }
          </Select.Content>
        </Select.Root>

        <Box asChild minWidth='13rem'>
          <Select.Root value={relative ? '1' : '0'} onValueChange={checked => setRelative(checked == '1')}>
            <Select.Trigger />
            <Select.Content>
              <Select.Item value={'0'}>Relative to dataset</Select.Item>
              <Select.Item value={'1'}>Relative to realtime</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>

        <Box asChild minWidth='13rem'>
          <Select.Root value={lastMs.toString()} onValueChange={value => setLastMs(+value)}>
            <Select.Trigger />

            <Select.Content>
              <Select.Item value='0'>All data</Select.Item>
              <Select.Item value='60000'>Last minute</Select.Item>
              <Select.Item value='300000'>Last 5 minute</Select.Item>
              <Select.Item value='600000'>Last 10 minute</Select.Item>
              <Select.Item value='900000'>Last 15 minute</Select.Item>
              <Select.Item value='1800000'>Last 30 minute</Select.Item>
              <Select.Item value='3600000'>Last hour</Select.Item>
              <Select.Item value='7200000'>Last 2 hours</Select.Item>
              <Select.Item value='10800000'>Last 3 hours</Select.Item>
              <Select.Item value='14400000'>Last 4 hours</Select.Item>
              <Select.Item value='21600000'>Last 6 hours</Select.Item>
              <Select.Item value='32400000'>Last 9 hours</Select.Item>
              <Select.Item value='43200000'>Last 12 hours</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>

        <Box asChild minWidth='13rem'>
          <Select.Root value={updateRate.toString()} onValueChange={value => setUpdateRate(+value)}>
            <Select.Trigger />

            <Select.Content>
              <Select.Item value='1000'>Every second</Select.Item>
              <Select.Item value='500'>Every 500ms</Select.Item>
              <Select.Item value='250'>Every 250ms</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>

        <AlertDialog.Root>
          <AlertDialog.Trigger>
            <IconButton color='red' disabled={!entryName} variant='outline'>
              <TrashIcon />
            </IconButton>
          </AlertDialog.Trigger>

          <AlertDialog.Content maxWidth='20rem'>
            <AlertDialog.Title>Remove all values in dataset?</AlertDialog.Title>
            <AlertDialog.Description>You are about to remove all values in the dataset <Code>{entryName}</Code>.</AlertDialog.Description>

            <Flex gap='3' mt='5' justify='end'>
              <AlertDialog.Cancel>
                <Button color='gray' variant='soft'>Cancel</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action onClick={() =>
                fetcher(`/api/entries/${entryName}`, { method: 'DELETE' })
                  .catch(console.error)
              }>
                <Button color='red'>Remove</Button>
              </AlertDialog.Action>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>
      </Flex>

      {entryName && <Chart relative={relative} name={entryName} last_ms={lastMs} updateRate={updateRate} />}
    </Flex>
  )
}
export default ChartListing