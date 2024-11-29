'use client';

import Box from '@/components/Box';


const error = () => {
  return (
    <Box className='h-full flex items-center justify-center'>
      <div className='text-neutral-400'>
        Oops, algo de errado aqui não está certo 😭   
      </div>
      
    </Box>
  )
}

export default error;
