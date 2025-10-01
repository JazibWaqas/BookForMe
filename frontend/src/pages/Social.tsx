import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/Social.css';

type SocialTab = 'feed' | 'play' | 'leaderboard' | 'chats';

interface Post {
  id: string;
  user: string;
  role?: string;
  time: string;
  text: string;
  image?: string;
  likes?: number;
  comments?: number;
}

interface Match {
  id: string;
  title: string;
  sport: string;
  level: string;
  time: string;
  location: string;
  type: 'ranked' | 'casual';
  spotsLeft: number;
}

const Social: React.FC = () => {
  const [tab, setTab] = useState<SocialTab>('feed');
  const [matchType, setMatchType] = useState<'ranked' | 'casual'>('casual');

  const posts: Post[] = useMemo(
    () => [
      {
        id: 'p1',
        user: 'Alex Kumar',
        role: 'Pro',
        time: '2 hours ago',
        text:
          "Just had an amazing padel match at Elite Sports! Looking for doubles partner for tomorrow 7 PM. Who's in? 🎾",
        image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1400&auto=format&fit=crop',
        likes: 12,
        comments: 5,
      },
      {
        id: 'p2',
        user: 'Priya Shah',
        time: '6 hours ago',
        text: 'Anyone up for a casual badminton session in DHA Phase 6 this evening? 🏸',
        likes: 5,
        comments: 3,
      },
    ],
    []
  );

  const matches: Match[] = useMemo(
    () => [
      {
        id: 'm1',
        title: 'Padel Doubles',
        sport: 'Padel',
        level: 'Intermediate',
        time: 'Today • 7:00 PM',
        location: 'Elite Sports Complex',
        type: 'casual',
        spotsLeft: 2,
      },
      {
        id: 'm2',
        title: 'Badminton Singles',
        sport: 'Badminton',
        level: 'Advanced',
        time: 'Tomorrow • 6:30 PM',
        location: 'Royal Courts',
        type: 'ranked',
        spotsLeft: 1,
      },
      {
        id: 'm3',
        title: 'Cricket 6-A-Side',
        sport: 'Cricket',
        level: 'All Levels',
        time: 'Sat • 4:00 PM',
        location: 'City Sports Arena',
        type: 'casual',
        spotsLeft: 5,
      },
    ],
    []
  );

  const leaderboard = useMemo(
    () => [
      { rank: 1, name: 'Sarah Chen', sport: 'Tennis', rating: 2120 },
      { rank: 2, name: 'Mike Johnson', sport: 'Padel', rating: 2075 },
      { rank: 3, name: 'Arjun Sharma', sport: 'Cricket (1v1)', rating: 2010 },
      { rank: 4, name: 'Ayesha Khan', sport: 'Badminton', rating: 1990 },
    ],
    []
  );

  return (
    <>
      <Header />
      <div className="social-page">
        <div className="social-container">
          {/* Top intro */}
          <div className="social-header">
            <h1 className="title">Community</h1>
            <p className="subtitle">Connect with others and find matches</p>
          </div>

          {/* Tabs */}
          <div className="tabs" role="tablist" aria-label="social-tabs">
            <button className={`tab ${tab === 'feed' ? 'active' : ''}`} onClick={() => setTab('feed')} role="tab" aria-selected={tab==='feed'}>
              Feed
            </button>
            <button className={`tab ${tab === 'play' ? 'active' : ''}`} onClick={() => setTab('play')} role="tab" aria-selected={tab==='play'}>
              Find Match
            </button>
            <button className={`tab ${tab === 'leaderboard' ? 'active' : ''}`} onClick={() => setTab('leaderboard')} role="tab" aria-selected={tab==='leaderboard'}>
              Ranked
            </button>
            <button className={`tab ${tab === 'chats' ? 'active' : ''}`} onClick={() => setTab('chats')} role="tab" aria-selected={tab==='chats'}>
              Chats
            </button>
          </div>

          {/* FEED */}
          {tab === 'feed' && (
            <section className="feed">
              {posts.map((p) => (
                <article key={p.id} className="post-card">
                  <div className="post-head">
                    <div className="avatar">{p.user.split(' ').map(x=>x[0]).slice(0,2).join('')}</div>
                    <div className="meta">
                      <div className="name-row">
                        <span className="name">{p.user}</span>
                        {p.role && <span className="badge">{p.role}</span>}
                        <span className="time">{p.time}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text">{p.text}</p>
                  {p.image && (
                    <div className="media">
                      <img src={p.image} alt="post" />
                    </div>
                  )}
                  <div className="actions">
                    <button>👍 {p.likes ?? 0}</button>
                    <button>💬 {p.comments ?? 0}</button>
                    <button>↗︎ Share</button>
                  </div>
                </article>
              ))}
            </section>
          )}

          {/* FIND MATCH */}
          {tab === 'play' && (
            <section className="play">
              <div className="toolbar">
                <div className="mode-toggle">
                  <button className={`mode-btn ${matchType==='casual'?'active':''}`} onClick={()=>setMatchType('casual')}>Casual</button>
                  <button className={`mode-btn ${matchType==='ranked'?'active':''}`} onClick={()=>setMatchType('ranked')}>Ranked</button>
                </div>
                <button className="primary">+ Create Match</button>
              </div>

              <div className="matches">
                {matches
                  .filter(m => matchType === 'casual' ? m.type==='casual' : m.type==='ranked')
                  .map(m => (
                  <div key={m.id} className="match-card">
                    <div className="top">
                      <div className="pill {m.type}">{m.type}</div>
                      <h3 className="title">{m.title}</h3>
                      <div className="sub">{m.sport} • {m.level}</div>
                    </div>
                    <div className="details">
                      <span>📍 {m.location}</span>
                      <span>🕒 {m.time}</span>
                      <span>👥 {m.spotsLeft} spots left</span>
                    </div>
                    <div className="actions">
                      <button className="secondary">View</button>
                      <button className="primary">Join</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* LEADERBOARD */}
          {tab === 'leaderboard' && (
            <section className="leaderboard">
              <div className="panel">
                <h3 className="section-heading">Your Current Rank</h3>
                <div className="rank-card">
                  <div className="rank-text">Tennis - Intermediate Level</div>
                  <div className="rank-badge">#247</div>
                </div>
                <button className="primary wide">Start Ranked Match</button>
              </div>

              <div className="panel">
                <h3 className="section-heading">Top Players</h3>
                <table className="table">
                  <thead>
                    <tr><th>#</th><th>Player</th><th>Sport</th><th>Rating</th></tr>
                  </thead>
                  <tbody>
                    {leaderboard.map(r => (
                      <tr key={r.rank}>
                        <td>{r.rank}</td>
                        <td>{r.name}</td>
                        <td>{r.sport}</td>
                        <td>{r.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* CHATS */}
          {tab === 'chats' && (
            <section className="chats">
              <div className="chat-list">
                {[{n:'Alex Kumar', last:'Want to play padel tomorrow?'}, {n:'Sarah Chen', last:'GG! That was fun.'}].map((c,i)=> (
                  <div className="chat-item" key={i}>
                    <div className="avatar">{c.n.split(' ').map(x=>x[0]).join('')}</div>
                    <div className="info">
                      <div className="name">{c.n}</div>
                      <div className="preview">{c.last}</div>
                    </div>
                    <Link to="/chat" className="open">Open</Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default Social;
