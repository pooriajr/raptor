function ActionPointsSlide() {
  return (
    <div className="slide-content actions-slide">
      <div className="actions-columns">
        <div className="actions-column raptor">
          <h3>Raptor Actions</h3>
          <p className="actions-intro">
            You can spend action points to perform actions using the mother raptor and any active baby raptors. A baby
            raptor is active if its figurine is standing up. A raptor can never move to or move through a space occupied
            by a fire token.
          </p>
          <ul className="actions-list">
            <li>
              <strong>Move a baby raptor:</strong> For one action point, move a baby raptor to a free adjacent space.
              If by doing so the baby is placed on one of the half-spaces of an L-shaped tile, it escapes; remove the
              figurine from the board.
            </li>
            <li>
              <strong>Move the mother raptor:</strong> For one action point, move the mother raptor in a straight line
              as many spaces as you like, or until she runs into an obstacle (i.e. a rock, a fire token, or another
              figurine). If the mother is wounded: Before moving the mother raptor, lose as many action points as the
              number of sleep tokens on your player aid.
            </li>
            <li>
              <strong>Kill a scientist:</strong> For one action point, kill a scientist located on a space adjacent to
              the mother raptor; remove the scientist figurine from the board and return it to the box. Only the mother
              can kill scientists.
            </li>
            <li>
              <strong>Wake up a baby raptor:</strong> For one action point, wake up a sleeping baby raptor located on a
              space adjacent to the mother raptor. You cannot wake up a baby raptor the same round it was put to sleep
              by a scientist.
            </li>
            <li>
              <strong>Put out a fire:</strong> For one action point, put out a fire located on a space adjacent to the
              mother raptor; remove the fire token and all fire tokens connected to it orthogonally.
            </li>
          </ul>
        </div>
        <div className="actions-column scientist">
          <h3>Scientist Actions</h3>
          <p className="actions-intro">
            You can spend action points to perform actions using any active scientist. A scientist is active if its
            figurine is standing up. Scientists can move through and shoot through a space occupied by a fire token,
            but they cannot end their movement on a space occupied by a fire token.
          </p>
          <p className="actions-important">
            Each scientist can perform ONLY ONE aggressive action (shoot or capture) per round.
          </p>
          <ul className="actions-list">
            <li>
              <strong>Move a scientist:</strong> For one action point, move a scientist to an adjacent space that is
              not occupied by a raptor or another scientist.
            </li>
            <li>
              <strong>Stand a scientist back up:</strong> For one action point, stand a frightened scientist's figurine
              back up. You cannot stand a scientist back up the same round it was frightened.
            </li>
            <li>
              <strong>Put a baby raptor to sleep:</strong> For one action point, shoot a baby raptor located on a space
              adjacent to a scientist to put it to sleep.
            </li>
            <li>
              <strong>Capture a sleeping baby raptor:</strong> For one action point, capture a sleeping baby raptor
              located on a space adjacent to a scientist; remove its figurine from the board.
            </li>
            <li>
              <strong>Shoot the mother raptor:</strong> For one action point, use an active scientist to shoot the
              mother raptor. Scientists can shoot orthogonally in a straight line as far as desired, as long as there
              are no obstacles between the scientist and the mother raptor. Obstacles that block shooting are rocks and
              active scientists.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ActionPointsSlide;
