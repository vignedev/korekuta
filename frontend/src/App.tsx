import { Flex, Heading, Spinner, Theme } from '@radix-ui/themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'

const ChartListing = lazy(() => import('./components/chart'))

function App() {
  const queryClient = new QueryClient()

  return (
    <Theme appearance='dark'>
      <QueryClientProvider client={queryClient}>
        <Flex direction='column' gap='2' p='4'>
          <Heading>korekuta</Heading>

          <Suspense fallback={<Spinner/>}>
            <ChartListing/>
          </Suspense>
        </Flex>
      </QueryClientProvider>
    </Theme>
  )
}

export default App
