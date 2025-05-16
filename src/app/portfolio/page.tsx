export default function Portfolio() {
  const sports = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer'];
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">SMAC Portfolio</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sports.map((sport) => (
          <div key={sport} className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">{sport}</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium mb-2">This Week</h3>
                <div className="flex justify-between">
                  <span>Record:</span>
                  <span>3-2</span>
                </div>
                <div className="flex justify-between">
                  <span>Units:</span>
                  <span className="text-green-600">+2.5</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium mb-2">This Month</h3>
                <div className="flex justify-between">
                  <span>Record:</span>
                  <span>12-8</span>
                </div>
                <div className="flex justify-between">
                  <span>Units:</span>
                  <span className="text-green-600">+8.2</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium mb-2">Season</h3>
                <div className="flex justify-between">
                  <span>Record:</span>
                  <span>45-35</span>
                </div>
                <div className="flex justify-between">
                  <span>Units:</span>
                  <span className="text-green-600">+25.7</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 