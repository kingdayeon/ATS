function App() {
  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-12 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4 underline decoration-wavy decoration-pink-500">
          Hello, Tailwind CSS! 🎨
        </h1>
        <p className="text-gray-700 text-lg mb-6">
          Tailwind CSS가 정상적으로 작동하고 있다면 이 카드가 예쁘게 스타일링되어 보일 거예요!
        </p>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-lg hover:shadow-xl">
          테스트 버튼
        </button>
      </div>
    </div>
  )
}

export default App
