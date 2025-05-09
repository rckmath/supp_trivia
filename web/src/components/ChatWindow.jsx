import { useRef, useEffect } from 'react';

export default function ChatWindow({ messages, onSend, disabled, nickname, team }) {
  const inputRef = useRef();
  const endRef = useRef();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const value = inputRef.current.value.trim();
    if (value) {
      onSend(value);
      inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-y-auto bg-gray-100 rounded-t-lg p-4 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={
            msg.type === 'judge' ?
              'text-xs bg-yellow-100 border-l-4 border-yellow-400 px-3 py-2 rounded text-gray-800' :
              msg.team === 'A' ?
                'text-sm bg-blue-100 px-3 py-2 rounded self-start max-w-xs' :
                msg.team === 'B' ?
                  'text-sm bg-orange-100 px-3 py-2 rounded self-end max-w-xs ml-auto' :
                  'text-sm bg-gray-200 px-3 py-2 rounded'
          }>
            {msg.type === 'judge' ? <span className="font-bold mr-2">Juiz:</span> : null}
            <span>{msg.text}</span>
            {msg.nickname && <span className="ml-2 text-xs text-gray-500">({msg.nickname})</span>}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 p-2 bg-white rounded-b-lg border-t">
        <input
          ref={inputRef}
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          type="text"
          placeholder={disabled ? "Espera a sua vez..." : "Manda sua mensagem..."}
          disabled={disabled}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          disabled={disabled}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
