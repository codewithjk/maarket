"use client"

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
 
function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(()=>new QueryClient())
  return (
        <QueryClientProvider client={queryClient}>
          {children}
           <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default Providers