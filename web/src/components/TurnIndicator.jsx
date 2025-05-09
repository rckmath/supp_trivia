export default function TurnIndicator({ currentTeam }) {
  return (
    <div className="flex justify-center my-2">
      <span className={
        currentTeam === 'A'
          ? 'bg-blue-600 text-white px-4 py-1 rounded font-semibold'
          : 'bg-orange-500 text-white px-4 py-1 rounded font-semibold'
      }>
        É a vez do Time {currentTeam === 'A' ? 'Azul' : 'Laranja'}
      </span>
    </div>
  );
}
