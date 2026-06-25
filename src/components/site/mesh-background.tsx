export function MeshBackground() {
  return (
    <>
      <div className="mesh" aria-hidden>
        <i style={{ width: '48vw', height: '48vw', left: '-8vw', top: '-10vw', background: '#2D7CFF', opacity: 0.5 }} />
        <i style={{ width: '40vw', height: '40vw', right: '-6vw', top: '-2vw', background: '#F05BC4', opacity: 0.45, animationDelay: '-5s' }} />
        <i style={{ width: '44vw', height: '44vw', left: '20vw', bottom: '-16vw', background: '#7C5CFF', opacity: 0.45, animationDelay: '-9s' }} />
        <i style={{ width: '36vw', height: '36vw', right: '6vw', bottom: '-8vw', background: '#22D3EE', opacity: 0.5, animationDelay: '-13s' }} />
      </div>
      <div className="grain" aria-hidden />
    </>
  );
}
