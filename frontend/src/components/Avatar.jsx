const COLORS = ['#1890FF', '#0ACF83', '#FF7A50', '#9B59B6', '#F5A623', '#2ECC71', '#E74C3C'];

function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initialsFor(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function Avatar({ name, size = 44 }) {
  return (
    <div
      className="_avatar_circle"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.4)),
        background: colorFor(name || '?'),
      }}
      title={name}
    >
      {initialsFor(name || '?')}
    </div>
  );
}
