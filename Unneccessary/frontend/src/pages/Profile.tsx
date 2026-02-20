import React from 'react';
import Header from '../components/Header';

const Profile: React.FC = () => {
  return (
    <>
      <Header />
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Profile Page</h1>
        <p>Profile settings coming soon...</p>
      </div>
    </>
  );
};

export default Profile;
