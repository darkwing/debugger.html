/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow
import { connect } from "react-redux";
import React, { Component } from "react";
import { uniq, isEqual } from "lodash";

import Breakpoint from "./Breakpoint";

import { getSelectedSource, getVisibleBreakpoints } from "../../selectors";
import { makeLocationId } from "../../utils/breakpoint";
import { isLoaded } from "../../utils/source";

import type { Breakpoint as BreakpointType, Source } from "../../types";

type Props = {
  selectedSource: Source,
  breakpoints: BreakpointType[],
  editor: Object
};

function getBreakpointLines(bps) {
  return uniq(bps.map(bp => bp.location.line).filter(Boolean)).sort();
}

function breakpointLinesMatch(oldBreakpoints, newBreakpoints) {
  return isEqual(
    getBreakpointLines(oldBreakpoints),
    getBreakpointLines(newBreakpoints)
  );
}

class Breakpoints extends Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    if (nextProps.selectedSource && !isLoaded(nextProps.selectedSource)) {
      return false;
    }

    if (breakpointLinesMatch(this.props.breakpoints, nextProps.breakpoints)) {
      return false;
    }

    return true;
  }

  render() {
    const { breakpoints, selectedSource, editor } = this.props;

    if (!selectedSource || !breakpoints || selectedSource.isBlackBoxed) {
      return null;
    }

    return (
      <div>
        {breakpoints.map(bp => {
          return (
            <Breakpoint
              key={makeLocationId(bp.location)}
              breakpoint={bp}
              selectedSource={selectedSource}
              editor={editor}
            />
          );
        })}
      </div>
    );
  }
}

export default connect(state => ({
  breakpoints: getVisibleBreakpoints(state),
  selectedSource: getSelectedSource(state)
}))(Breakpoints);
