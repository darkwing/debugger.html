/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow
import { Component } from "react";
import { toEditorLine, endOperation, startOperation } from "../../utils/editor";
import { getDocument, hasDocument } from "../../utils/editor/source-documents";
import { isLoaded } from "../../utils/source";

import { connect } from "../../utils/connect";
import {
  getVisibleSelectedFrame,
  getSelectedLocation,
  getSelectedSource,
  getPauseCommand
} from "../../selectors";

import type { Frame, SourceLocation, Source } from "../../types";
import type { Command } from "../../reducers/types";

type Props = {
  pauseCommand: Command,
  selectedFrame: Frame,
  selectedLocation: SourceLocation,
  selectedSource: Source
};

function isDebugLine(selectedFrame: Frame, selectedLocation: SourceLocation) {
  if (!selectedFrame) {
    return;
  }

  return (
    selectedFrame.location.sourceId == selectedLocation.sourceId &&
    selectedFrame.location.line == selectedLocation.line
  );
}

function isDocumentReady(selectedSource, selectedLocation) {
  return (
    selectedLocation &&
    isLoaded(selectedSource) &&
    hasDocument(selectedLocation.sourceId)
  );
}

export class HighlightLine extends Component<Props> {
  isStepping: boolean = false;
  previousEditorLine: ?number = null;

  shouldComponentUpdate(nextProps: Props) {
    const { selectedLocation, selectedSource } = nextProps;
    return this.shouldSetHighlightLine(selectedLocation, selectedSource);
  }

  componentDidMount() {
    const { selectedLocation, selectedSource } = this.props;
    if (this.shouldSetHighlightLine(selectedLocation, selectedSource)) {
    }
  }

  shouldSetHighlightLine(
    selectedLocation: SourceLocation,
    selectedSource: Source
  ) {
    const { sourceId, line } = selectedLocation;
    const editorLine = toEditorLine(sourceId, line);

    if (!isDocumentReady(selectedSource, selectedLocation)) {
      console.warn(
        "HighlightLine: shouldSetHighlightLine: document not ready!"
      );
      return false;
    }

    if (this.isStepping && editorLine === this.previousEditorLine) {
      console.warn(
        "HighlightLine: shouldSetHighlightLine: stepping or same line!"
      );
      return false;
    }

    return true;
  }

  componentDidUpdate(prevProps: Props) {
    this.completeHighlightLine(prevProps);
  }

  componentDidMount() {
    this.completeHighlightLine(null);
  }

  completeHighlightLine(prevProps: Props | null) {
    const {
      pauseCommand,
      selectedLocation,
      selectedFrame,
      selectedSource
    } = this.props;
    if (pauseCommand) {
      this.isStepping = true;
    }

    startOperation();
    if (prevProps) {
      this.clearHighlightLine(
        prevProps.selectedLocation,
        prevProps.selectedSource
      );
    }
    this.setHighlightLine(selectedLocation, selectedFrame, selectedSource);
    endOperation();
  }

  setHighlightLine(
    selectedLocation: SourceLocation,
    selectedFrame: Frame,
    selectedSource: Source
  ) {
    console.log("setHighlightLine!");

    const { sourceId, line } = selectedLocation;
    if (!this.shouldSetHighlightLine(selectedLocation, selectedSource)) {
      console.warn(
        "HighlightLine: setHighlightLine: shouldSetHighlightLine is false!"
      );
      return;
    }
    this.isStepping = false;
    const editorLine = toEditorLine(sourceId, line);
    this.previousEditorLine = editorLine;

    if (!line || isDebugLine(selectedFrame, selectedLocation)) {
      console.warn("HighlightLine: setHighlightLine: line not found!");
      return;
    }

    const doc = getDocument(sourceId);
    console.info("Adding highlightLine!");
    doc.addLineClass(editorLine, "line", "highlight-line");
  }

  clearHighlightLine(selectedLocation: SourceLocation, selectedSource: Source) {
    if (!isDocumentReady(selectedSource, selectedLocation)) {
      return;
    }

    const { line, sourceId } = selectedLocation;
    const editorLine = toEditorLine(sourceId, line);
    const doc = getDocument(sourceId);
    doc.removeLineClass(editorLine, "line", "highlight-line");
  }

  render() {
    console.log("<highlightline> render!", this.props);
    return null;
  }
}

export default connect(state => ({
  pauseCommand: getPauseCommand(state),
  selectedFrame: getVisibleSelectedFrame(state),
  selectedLocation: getSelectedLocation(state),
  selectedSource: getSelectedSource(state)
}))(HighlightLine);
