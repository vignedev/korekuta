import { Box, Callout, DataList, Flex, Select, Spinner, Text, TextField, useThemeContext, Tooltip as RadixTooltip, IconButton, AlertDialog, Code, Button } from '@radix-ui/themes'
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

ChartJS.register(
  PointElement,
  LineElement,
  Title,
  Tooltip,
  TimeScale, LinearScale,
  Filler
)

const ChartDataView = memo(({ data }: { data: DataEntry[] }) => {
  const last = data.at(-1)

  return (
    <DataList.Root orientation='vertical'>
      <DataList.Item>
        <DataList.Label>Last Value</DataList.Label>
        <DataList.Value>{last?.value}</DataList.Value>
      </DataList.Item>
      <DataList.Item>
        <DataList.Label>Last Update</DataList.Label>
        <DataList.Value>{last && new Date(last.timestamp).toLocaleString()}</DataList.Value>
      </DataList.Item>
      <DataList.Item>
        <DataList.Label>Minimum</DataList.Label>
        <DataList.Value>{data && data.reduce((acc, val) => Math.min(acc, val.value), data[0].value)}</DataList.Value>
      </DataList.Item>
      <DataList.Item>
        <DataList.Label>Maximum</DataList.Label>
        <DataList.Value>{data && data.reduce((acc, val) => Math.max(acc, val.value), 0)}</DataList.Value>
      </DataList.Item>
      <DataList.Item>
        <DataList.Label>Average</DataList.Label>
        <DataList.Value>{data && (data.reduce((acc, val) => acc += val.value, 0) / data.length).toFixed(4)}</DataList.Value>
      </DataList.Item>
    </DataList.Root>
  )
})

const Chart = memo(({ name, last_ms, updateRate }: { name: string, last_ms?: number, updateRate?: number }) => {
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
    <ChartDataView data={data.data} />

    <Box width='100%'>
      <Line options={{
        scales: {
          x: {
            type: 'time',
            min: last_ms ? (Date.now() - last_ms) : undefined
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
            borderColor: '#af2',
            backgroundColor: '#af25',
            fill: true,
            stepped: true
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
          <Select.Root value={lastMs.toString()} onValueChange={value => setLastMs(+value)}>
            <Select.Trigger />

            <Select.Content>
              <Select.Item value='0'>All data</Select.Item>
              <Select.Item value='60000'>Last minute</Select.Item>
              <Select.Item value='300000'>Last 5 minute</Select.Item>
              <Select.Item value='600000'>Last 10 minute</Select.Item>
              <Select.Item value='900000'>Last 15 minute</Select.Item>
              <Select.Item value='1800000'>Last 30 minute</Select.Item>
              <Select.Item value='3600000'>Last hour minute</Select.Item>
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

      {entryName && <Chart name={entryName} last_ms={lastMs} updateRate={updateRate}/>}
    </Flex>
  )
}
export default ChartListing