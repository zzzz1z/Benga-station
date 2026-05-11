'use client';

import Box from '@/components/Box'
import {BounceLoader} from 'react-spinners'

const loading = () => {
  return (
    <Box className='h-full flex items-center justify-center'>
        <BounceLoader color='#A52A2A' size={40} />
    </Box>
   
  )
}

export default loading
