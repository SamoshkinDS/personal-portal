import React from 'react';
export default function Posts() {
  const [posts, setPosts] = React.useState(() => JSON.parse(localStorage.getItem('posts') || '[]'));
  const [text, setText] = React.useState('');
  const addPost = () => {
    if (!text.trim()) return;
    const updated = [...posts, { text, date: new Date().toLocaleString() }];
    setPosts(updated);
    localStorage.setItem('posts', JSON.stringify(updated));
    setText('');
  };
  return (
    <div className='p-8'>
      <h2 className='text-2xl font-semibold mb-4'>ПОСТЫ</h2>
      <textarea value={text} onChange={(e) => setText(e.target.value)} className='w-full border rounded p-2 mb-2' placeholder='Напиши заметку...' />
      <button onClick={addPost} className='bg-blue-600 text-white px-4 py-2 rounded'>Сохранить</button>
      <div className='mt-6 space-y-3'>
        {posts.map((p, i) => (
          <div key={i} className='p-4 border rounded bg-white'>
            <p>{p.text}</p>
            <p className='text-xs text-gray-500'>{p.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}