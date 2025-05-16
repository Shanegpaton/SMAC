export default function Traders() {
  const traders = [
    {
      name: 'Trader 1',
      record: '45-35',
      units: '+25.7',
      winRate: '56.3%',
      sports: ['NFL', 'NBA']
    },
    {
      name: 'Trader 2',
      record: '38-28',
      units: '+18.2',
      winRate: '57.6%',
      sports: ['MLB', 'NHL']
    },
    {
      name: 'Trader 3',
      record: '42-31',
      units: '+22.5',
      winRate: '57.5%',
      sports: ['Soccer', 'NBA']
    }
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Our Traders</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {traders.map((trader, index) => (
          <div key={index} className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">{trader.name}</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Record:</span>
                  <span>{trader.record}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Units:</span>
                  <span className="text-green-600">{trader.units}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Win Rate:</span>
                  <span>{trader.winRate}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium mb-2">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {trader.sports.map((sport) => (
                    <span key={sport} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {sport}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 