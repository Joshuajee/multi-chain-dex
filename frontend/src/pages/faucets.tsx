import TokenSelector from '@/components/wigets/TokenSelector'
import Container from '@/components/utils/Container'
import Layout from '@/components/utils/Layout'


export default function Facets() {
  
  return (
    <Layout>

      <Container>

        <div className='flex justify-center w-full items-center'>

          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">

              <table className="w-full bg-gray-50 text-sm text-left text-gray-500">
            
                <thead className="text-xs text-gray-700 uppercase">
                 
                  <tr>
                 
                    <th scope="col" className="px-6 py-3">
                      Network name
                    </th>
                 
                    <th scope="col" className="px-6 py-3">
                      Currency
                    </th>
                 
                    <th scope="col" className="px-6 py-3">
                      Facet Link
                    </th>
                 
                  </tr>
                
                </thead>
                
                  <tbody>

                    <tr className="border-b border-gray-200 dark:border-gray-700">
                     
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap bg-gray-50 dark:text-white ">
                        Polygon Mumbai
                      </th>

                      <td className="px-6 py-4 bg-gray-50 ">
                        MATIC
                      </td>

                      <td className="px-6 py-4">
                        <a
                          target='_blank' 
                          href='https://faucet.polygon.technology/'>
                            Mumbai Faucet
                        </a>
                      </td>

                    </tr>

                    <tr className="border-b border-gray-200 dark:border-gray-700">
                     
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap bg-gray-50 dark:text-white ">
                        Avalanche Fuji
                      </th>

                      <td className="px-6 py-4 bg-gray-50 ">
                        AVAX 
                      </td>

                      <td className="px-6 py-4">
                        <a
                          target='_blank' 
                          href='https://faucet.avax.network/'>
                            Avalache Fuji Faucet
                        </a>
                      </td>

                   </tr>

                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap bg-gray-50 dark:text-white ">
                      Alfajores
                    </th>

                    <td className="px-6 py-4 bg-gray-50 ">
                      CELO
                    </td>

                    <td className="px-6 py-4">
                      <a
                        target='_blank' 
                        href='https://faucet.celo.org/alfajores'>
                          Mumbai Faucet
                      </a>
                    </td>

                  </tr>

                  </tbody>

              </table>

          </div>

        </div>

      </Container>

    </Layout>
  )
}
