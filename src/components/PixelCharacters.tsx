type Props = { celebration: boolean };

export default function PixelCharacters({ celebration }: Props) {
  return (
    <div className={`pixel-pals four-player-scene${celebration ? ' celebrate' : ''}`} aria-hidden="true">
      <img
        className="players-scene"
        src="/assets/team-pixel-pals-v3.png"
        alt=""
        draggable={false}
      />
      {celebration && <span className="pixel-spark">✦</span>}
    </div>
  );
}
