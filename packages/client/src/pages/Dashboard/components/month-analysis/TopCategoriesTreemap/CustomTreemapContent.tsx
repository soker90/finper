const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, depth, fill } = props
  const showLabel = width > 60 && height > 30 && depth > 0 && name !== 'Total'

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke='#fff'
        strokeWidth={depth === 1 ? 2 : 1}
        rx={3}
        ry={3}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor='middle'
          dominantBaseline='middle'
          fill='#fff'
          fontSize={width < 80 ? 9 : 11}
          fontWeight={600}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {name.length > 14 ? `${name.slice(0, 13)}…` : name}
        </text>
      )}
    </g>
  )
}

export default CustomTreemapContent
