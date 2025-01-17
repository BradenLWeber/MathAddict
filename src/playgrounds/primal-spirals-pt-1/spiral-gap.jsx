import { useEffect, useRef, useState } from 'react';

import { LinearProgress } from '@mui/material';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { sieveOfAtkin } from 'utilities/functions';
import { useWindowSize } from 'utilities/useWindowSize';

const MARGIN = 40;
const POINTS_TO_SHOW = 100;

const getGaps = (primes) => {
  const gaps = [];
  for (let i = 0; i < primes.length - 1; i++) {
    gaps.push((primes[i + 1] - primes[i]) / 2);
  }
  return gaps;
};

const normalizePoints = (pointList) => {
  const currentMinX = _.minBy(pointList, function (point) {
    return point[0];
  })[0];
  const currentMinY = _.minBy(pointList, function (point) {
    return point[1];
  })[1];

  if (currentMinX < MARGIN) {
    const add = MARGIN - currentMinX;
    for (let i = 0; i < pointList.length; i++) {
      pointList[i][0] += add;
    }
  }
  if (currentMinY < MARGIN) {
    const add = MARGIN - currentMinY;
    for (let i = 0; i < pointList.length; i++) {
      pointList[i][1] += add;
    }
  }

  return pointList;
};

const getRgb = (i, colorType, totalPoints) => {
  if (colorType === 'rainbow') {
    const red = [255, 0, 0];
    const orange = [255, 165, 0];
    const yellow = [222, 222, 0];
    const green = [0, 255, 0];
    const blue = [0, 0, 255];
    const violet = [138, 43, 226];
    const wave = [red, orange, yellow, green, blue, violet];

    if (i === totalPoints) return 'rgb(138, 43, 226)';

    const sectionSize = Math.ceil(totalPoints / 5);
    const section = Math.floor(i / sectionSize);
    const sectionDistance = i - sectionSize * section;
    const startColor = wave[section];
    const endColor = wave[section + 1];

    return `rgb(${
      startColor[0] +
      Math.round(
        ((endColor[0] - startColor[0]) / sectionSize) * sectionDistance,
      )
    }, ${
      startColor[1] +
      Math.round(
        ((endColor[1] - startColor[1]) / sectionSize) * sectionDistance,
      )
    }, ${
      startColor[2] +
      Math.round(
        ((endColor[2] - startColor[2]) / sectionSize) * sectionDistance,
      )
    })`;
  } else if (colorType === 'random') {
    const slowDifference = Math.round(Math.cos((i + 100) / 120) * 100);
    const slowerDifference = Math.round(Math.cos((i + 20) / 179) * 100);
    const slowestDifference = Math.round(Math.cos((i + 180) / 257) * 100);
    return `rgb(${125 + slowDifference}, ${125 + slowerDifference}, ${
      125 + slowestDifference
    })`;
  } else {
    const difference = Math.round(Math.cos(i / 15) * 25);
    return `rgb(${225 + difference}, ${125 + difference}, ${25 + difference})`;
  }
};

const ProgressBar = (props) => (
  <LinearProgress
    variant='determinate'
    value={props.percent}
    sx={{
      width: Math.min(347, props.windowSize.width - 40),
      '& .MuiLinearProgress-bar': {
        transition: 'none',
      },
    }}
  />
);

const SpiralGap = (props) => {
  const { scale, ceil, floor, angle, animate, colorType, dev } = props;
  let strokeWidth = scale / 2;
  if (scale < 0.5) strokeWidth = scale / 1.5;
  if (scale < 0.1) strokeWidth = scale;

  const [delayedPoints, setDelayedPoints] = useState([]);
  const delayedPointsRef = useRef(delayedPoints);
  delayedPointsRef.current = delayedPoints;
  const [minX, setMinX] = useState(0);
  const minXRef = useRef(minX);
  minXRef.current = minX;
  const [maxX, setMaxX] = useState(1000);
  const maxXRef = useRef(maxX);
  maxXRef.current = maxX;
  const [minY, setMinY] = useState(0);
  const minYRef = useRef(minY);
  minYRef.current = minY;
  const [maxY, setMaxY] = useState(1000);
  const maxYRef = useRef(maxY);
  maxYRef.current = maxY;
  const [points, setPoints] = useState([]);
  const pointsRef = useRef(points);
  pointsRef.current = points;

  const windowSize = useWindowSize();

  useEffect(() => {
    const primes = sieveOfAtkin(floor, ceil);
    const gaps = getGaps(primes);
    const rawPoints = getPoints(gaps);
    const points = normalizePoints(rawPoints);
    setPoints(points);
    setMinX(
      _.minBy(points, function (point) {
        return point[0];
      })[0],
    );
    setMinY(
      _.minBy(points, function (point) {
        return point[1];
      })[1],
    );
    setMaxX(
      _.maxBy(points, function (point) {
        return point[0];
      })[0],
    );
    setMaxY(
      _.maxBy(points, function (point) {
        return point[1];
      })[1],
    );
    if (animate) setPointsWithDelay(points, 0, points.length);
  }, []);

  const getPoints = (gaps) => {
    const start = [0, 0];
    const points = [];
    points.push(start);

    let x;
    let y;
    let gap;
    const normalizedAngle = 180 - angle;
    let currentAngle = (normalizedAngle + 180) % 360;
    for (let i = 0; i < gaps.length; i++) {
      currentAngle = (currentAngle + normalizedAngle) % 360;

      x = points[i][0];
      y = points[i][1];
      gap = gaps[i];
      points.push([
        x + gap * scale * Math.cos((currentAngle * 2 * Math.PI) / 360),
        y + gap * scale * Math.sin((currentAngle * 2 * Math.PI) / 360),
      ]);
    }
    return points;
  };

  const pointsToString = (points) => {
    let pointString = '';
    for (let i = 0; i < points.length; i++) {
      pointString += `${points[i][0]}, ${points[i][1]} `;
    }
    return pointString;
  };

  const setPointsWithDelay = (points, i, length) => {
    if (i === length) return;
    setTimeout(() => {
      setDelayedPoints(() => delayedPointsRef.current.concat([points[i]]));
      setPointsWithDelay(points, i + 1, length);
    }, 4);
  };

  const sliceIndex =
    delayedPoints.length >= points.length * (dev ? 2 : 1)
      ? 0
      : delayedPoints.length - POINTS_TO_SHOW;
  const slicedDelayedPoints = delayedPoints.slice(
    sliceIndex >= 0 ? sliceIndex : 0,
  );

  if (!ceil) return;

  return (
    <>
      {animate && (
        <ProgressBar
          windowSize={windowSize}
          percent={
            (delayedPoints.length / (points.length * (dev ? 2 : 1))) * 100
          }
        />
      )}
      <svg
        width={maxXRef.current - minXRef.current + MARGIN * 2}
        height={maxYRef.current - minYRef.current + MARGIN * 2}
      >
        {animate ? (
          slicedDelayedPoints.map((point, i) => {
            if (i) {
              return (
                <line
                  x1={slicedDelayedPoints[i - 1][0]}
                  y1={slicedDelayedPoints[i - 1][1]}
                  x2={point[0]}
                  y2={point[1]}
                  stroke={getRgb(i, colorType, points.length)}
                  fill='transparent'
                  strokeWidth={strokeWidth}
                  key={i}
                />
              );
            }
          })
        ) : ceil - floor < 500001 ? (
          points.map((point, i) => {
            if (i) {
              return (
                <line
                  x1={points[i - 1][0]}
                  y1={points[i - 1][1]}
                  x2={point[0]}
                  y2={point[1]}
                  stroke={getRgb(i, colorType, points.length)}
                  fill='transparent'
                  strokeWidth={strokeWidth}
                  key={i}
                />
              );
            }
          })
        ) : (
          <polyline
            stroke='orange'
            fill='transparent'
            strokeWidth={strokeWidth}
            points={pointsToString(points)}
          />
        )}
        {points.length && (
          <circle
            cx={points[0][0]}
            cy={points[0][1]}
            r={scale / 2}
            stroke='black'
            strokeWidth={scale / 4}
            fill='green'
          />
        )}
        {points.length && (
          <circle
            cx={points[points.length - 1][0]}
            cy={points[points.length - 1][1]}
            r={scale / 2}
            stroke='black'
            strokeWidth={scale / 4}
            fill='red'
          />
        )}
      </svg>
    </>
  );
};

SpiralGap.propTypes = {
  scale: PropTypes.number,
  ceil: PropTypes.number,
  floor: PropTypes.number,
  angle: PropTypes.number,
  animate: PropTypes.bool,
  colorType: PropTypes.string,
  dev: PropTypes.bool,
};

export default SpiralGap;

// Deal with all those console errors
