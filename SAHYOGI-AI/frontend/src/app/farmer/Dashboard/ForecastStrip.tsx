export default function ForecastStrip() {
  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-lg grid grid-cols-5 text-center text-sm text-gray-300">
      {["Today", "Fri", "Sat", "Sun", "Mon"].map((day, index) => (
        <div key={index}>
          <p className="font-medium">{day}</p>
          <p className="text-xl font-bold text-white mt-2">
            {30 + index}°
          </p>
          <p className="text-xs mt-1 opacity-70">
            {50 + index * 3}% rain
          </p>
        </div>
      ))}
    </div>
  );
}
