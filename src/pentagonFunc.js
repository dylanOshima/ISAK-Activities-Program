
const HIGH_LIGHT_COLOR = '#de6328';
const HIGH_LIGHT_COLOR_SUB = '#ad5529'
const NORMAL_COLOR = '#009b90';
const STROKE_COLOR = '#717073';

/**
 * Creates a pentagon at the given id. Various aspects of the pentagon can be
 * manipulated.
 * @param  {int} x  [width of pentagon]
 * @param  {int} y  [height of pentagon]
 * @param  {string} id [id of SVG element to place pentagon]
 * @param  {int} numLevels [the number of shards per slice]
 * @param  {int} scaleX [scales in the x dimension] optional
 * @param  {int} scaleY [scales in the y dimension] optional
 * @param  {[[int, int]]} hashPoints [A set of points that are already highlighted]
 */
function generatePentagon (x, y, id, numLevels=0, scaleX=1, scaleY=1, hashPoints) {
  let $svg = $(id);

  // 1. Calculates the points of the pentagon with the given parameters
  // Points follow clockwise around the pentagon, starting from the top most point
  function genPentagonPoints(ptX=x, ptY=y, offSetX=0, offSetY=0){
    let points = [[ptX/2, 0+offSetY], //Top most point
                  [ptX-offSetX, (ptY+offSetY/2)/2.5],
                  [((3*ptX)/4)-(offSetX/2), ptY-offSetY],
                  [(ptX/4)+(offSetX/2), ptY-offSetY],
                  [0+offSetX, (ptY+offSetY/2)/2.5]];
    points.forEach((point) => {
      point[0] *= scaleX;
      point[1] *= scaleY;
    });
    return points
  }

  let points = genPentagonPoints();

  // Calculate center
  let center = [(x*scaleX)/2, (y*scaleY)/2];

  //2. Set width and height of frame point on points
  $("#J-svg-pentagon").attr({
    width: points[1][0], //points[1][0] is the right-most point
    height: points[2][1] //points[2][1] || points[3][1] is the bottom-most point
  });

  //3. Generate the outer level of the pentagon
  $svg.find('.pentagon').attr('points', ptsToString(points))

  // 4. Generate the individual shards (a shard is the trapezoidal polygon that
  // gets highlighted) points based on the {numShards}. Each shard uses the
  // previous two points to calculate its' own points.
  let shards = [];

  for(let i=1;i<=numLevels;i++){
    let offSetX_prev = Math.floor(((i-1)/numLevels)*(x/2)),
        offSetY_prev = Math.floor(((i-1)/numLevels)*(y/2)),
        offSetX_curr = Math.floor((i/numLevels)*(x/2)),
        offSetY_curr = Math.floor((i/numLevels)*(y/2))
        points_Prev = genPentagonPoints(x,y, offSetX_prev, offSetY_prev),
        points_Curr = genPentagonPoints(x,y, offSetX_curr, offSetY_curr)

    for(let j=0;j<points.length;j++){
      let a = j,                       //First point
          b = (j+1) % (points.length), //Second Point
          pointSet = [points_Prev[a],points_Prev[b]];

      // Checks if it needs to make triangles
      if(i >= numLevels-1 ){ // Only activates if it's the second to the last lvl
        pointSet = pointSet.concat([center]);
      } else {
        pointSet = pointSet.concat([points_Curr[b], points_Curr[a]]);
      }

      shards.push(makeSVG('polygon', {
        class: "shard shard-" + j + i,
        fill: NORMAL_COLOR,
        stroke: STROKE_COLOR, //On even numbers the stroke should be lighter
        "stroke-dasharray": ((i+1) % 2 === 0) ? 0 : '4 4', // '4 4' indicates the spacing between lines in '0.5' row
        "stroke-width": ((i+1) % 2 === 0) ? 1 : 2, //0.4 + (numLevels - (i))*0.3, //mx+c => m = rate of change of thickness; c = starting thickness
        points: ptsToString(pointSet)
      }));

    }
  }

  /**
   * Updates the background color of a shard and cascades to shards below it
   * @param  {[int, int]} points [description]
   * @param  {String} color  [description]
   * @return {[type]}        [description]
   */
  function updateShardsCascade(shard_id, color, cap=0) {
    if(cap <= 0){
      for(let i=shard_id[1];i<=numLevels;i++){
        $('.shard-' + shard_id[0] + i).attr('fill', color);
      }
    } else {
      for(let i=1;i<cap;i++){
        $('.shard-' + shard_id[0] + i).attr('fill', color);
      }
    }
  }

  function onEnter(e) {
    let shard_id = getID(e.target);
    updateShardsCascade(shard_id, HIGH_LIGHT_COLOR);
  }

  function onLeave(e) {
    let shard_id = getID(e.target),
        currHash = getHash(),
        cap = currHash[currHash['page']][shard_id[0]];
    updateShardsCascade(shard_id, NORMAL_COLOR, cap[1]);
  }

  function onClick(e) {
    let shard_id = getID(e.target);
    setCoords(shard_id);
  }

  function onDblClick(e) {
    let shard_id = getID(e.target);
    updateShardsCascade(shard_id, NORMAL_COLOR);
    shard_id[1] = 0;
    setCoords(shard_id);
  }

  // 5. Adds the above functionality to each shard
  $svg.append(shards);
  $('.shard').hover(onEnter, onLeave); // Adds hover effect
  $('.shard').click(onClick); // Locks in the shard colors
  $('.shard').dblclick(onDblClick); // Resets the shard

  // Changes the background color of the background shards
  // based on the hashPoints array
  for(let i=0;i<hashPoints.length;i++){
    if(hashPoints[i][1] !== 0){
      updateShardsCascade(hashPoints[i], HIGH_LIGHT_COLOR);
    }
  }

  return points;
}

/* Generate the points for the labels of Awareness, Creative, etc.
    Depricated now since labels are now hard coded.
*/
// function generateText(points, id) {
//   const textPoints = [];
//
//   for(let i=0;i<points.length;i++){
//     let a = i,                       //First point
//         b = (i+1) % (points.length), //Second Point
//         pointSet = [points[a],points[b]],
//         mid = midPoint(pointSet);
//
//     textPoints.push(mid);
//   }
//
//   return textPoints;
// }
