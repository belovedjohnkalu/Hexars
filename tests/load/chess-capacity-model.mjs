// A planning model, NOT a load-test result. No network or credentials required.
const visitors=Number(process.env.ION_VISITORS||1_000_000);
const arrivalSeconds=Number(process.env.ION_ARRIVAL_SECONDS||60);
const playingFraction=Number(process.env.ION_PLAYING_FRACTION||0.1);
const moveSeconds=Number(process.env.ION_MOVE_SECONDS||10);
const computerFraction=Number(process.env.ION_COMPUTER_FRACTION||0.5);
const searchSeconds=Number(process.env.ION_SEARCH_SECONDS||1);
const searches=Number(process.env.ION_SEARCH_SLOTS||32);
for(const n of [visitors,arrivalSeconds,moveSeconds,searchSeconds,searches])if(!Number.isFinite(n)||n<=0)throw Error('Positive finite model inputs required.');
for(const n of [playingFraction,computerFraction])if(n<0||n>1)throw Error('Fractions must be between zero and one.');
const arrivals=visitors/arrivalSeconds,moves=visitors*playingFraction/moveSeconds,searchDemand=moves*computerFraction;
console.log(JSON.stringify({kind:'planning-model-not-benchmark',assumptions:{visitors,arrivalSeconds,playingFraction,moveSeconds,computerFraction,searchSeconds,searches},demand:{newVisitorsPerSecond:arrivals,openRealtimeConnections:visitors,newRealtimeConnectionsPerSecond:arrivals,movesPerSecond:moves,computerSearchesPerSecond:searchDemand,fullySignedInEarningHeartbeatsPerSecond:visitors/15},configuredSearch:{idealSearchesPerSecond:searches/searchSeconds,minimumSearchSlotsAtAssumedLatency:Math.ceil(searchDemand*searchSeconds),passesAssumedDemand:searches/searchSeconds>=searchDemand},limits:'This ignores cold starts, database contention, network, provider quotas and headroom. Measure them on provisioned staging.'},null,2));
