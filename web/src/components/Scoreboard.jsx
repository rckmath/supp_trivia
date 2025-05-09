export default function Scoreboard({ teamAScore, teamBScore }) {
  return (
    <div className="flex justify-center gap-8 my-2">
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold text-blue-700">Time Azul</span>
        <span className="text-2xl font-mono bg-blue-100 px-4 py-1 rounded mt-1">{teamAScore}</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold text-orange-600">Time Laranja</span>
        <span className="text-2xl font-mono bg-orange-100 px-4 py-1 rounded mt-1">{teamBScore}</span>
      </div>
    </div>
  );
}
