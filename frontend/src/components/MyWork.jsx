import React from 'react';
import './MyWork.css';

const MyWork = () => {
  return (
    <div className="my-work-container">
      <h2>İşlerim</h2>
      <p>Mevcut ve tamamlanmış işlerinizi burada görebilirsiniz.</p>
      <ul>
        <li>Devam Eden İş 1</li>
        <li>Tamamlanmış İş 1</li>
        <li>Bekleyen Teklif 1</li>
      </ul>
    </div>
  );
};

export default MyWork;
