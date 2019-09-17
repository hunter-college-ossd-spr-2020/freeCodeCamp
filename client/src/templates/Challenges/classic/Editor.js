import React, { Component, Suspense } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { navigate } from 'gatsby';

import { executeChallenge, updateFile } from '../redux';
import { userSelector, isDonationModalOpenSelector } from '../../../redux';
import { Loader } from '../../../components/helpers';

const MonacoEditor = React.lazy(() => import('react-monaco-editor'));

const propTypes = {
  canFocus: PropTypes.bool,
  contents: PropTypes.string,
  dimensions: PropTypes.object,
  executeChallenge: PropTypes.func.isRequired,
  ext: PropTypes.string,
  fileKey: PropTypes.string,
  nextChallengePath: PropTypes.string.isRequired,
  prevChallengePath: PropTypes.string.isRequired,
  theme: PropTypes.string,
  updateFile: PropTypes.func.isRequired
};

const mapStateToProps = createSelector(
  isDonationModalOpenSelector,
  userSelector,
  (open, { theme = 'night' }) => ({
    canFocus: !open,
    theme
  })
);

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      executeChallenge,
      updateFile
    },
    dispatch
  );

const modeMap = {
  css: 'css',
  html: 'html',
  js: 'javascript',
  jsx: 'javascript'
};

var monacoThemesDefined = false;
const defineMonacoThemes = monaco => {
  if (monacoThemesDefined) {
    return;
  }
  monacoThemesDefined = true;
  const yellowColor = 'FFFF00';
  const lightBlueColor = '9CDCFE';
  const darkBlueColor = '00107E';
  monaco.editor.defineTheme('vs-dark-custom', {
    base: 'vs-dark',
    inherit: true,
    colors: {
      'editor.background': '#2a2a40'
    },
    rules: [
      { token: 'delimiter.js', foreground: lightBlueColor },
      { token: 'delimiter.parenthesis.js', foreground: yellowColor },
      { token: 'delimiter.array.js', foreground: yellowColor },
      { token: 'delimiter.bracket.js', foreground: yellowColor }
    ]
  });
  monaco.editor.defineTheme('vs-custom', {
    base: 'vs',
    inherit: true,
    rules: [{ token: 'identifier.js', foreground: darkBlueColor }]
  });
};

class Editor extends Component {
  constructor(...props) {
    super(...props);

    this.options = {
      fontSize: '18px',
      scrollBeyondLastLine: false,
      selectionHighlight: false,
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
      renderIndentGuides: false,
      minimap: {
        enabled: false
      },
      selectOnLineNumbers: true,
      wordWrap: 'on',
      scrollbar: {
        horizontal: 'hidden',
        vertical: 'visible',
        verticalHasArrows: false,
        useShadows: false,
        verticalScrollbarSize: 5
      }
    };

    this._editor = null;
  }

  editorWillMount = monaco => {
    defineMonacoThemes(monaco);
  };

  editorDidMount = (editor, monaco) => {
    this._editor = editor;
    if (this.props.canFocus) this._editor.focus();
    this._editor.addAction({
      id: 'execute-challenge',
      label: 'Run tests',
      keybindings: [
        /* eslint-disable no-bitwise */
        monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter)
      ],
      run: this.props.executeChallenge
    });
    this._editor.addAction({
      id: 'navigate-prev',
      label: 'Navigate to previous challenge',
      keybindings: [
        /* eslint-disable no-bitwise */
        monaco.KeyMod.chord(
          monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.PageDown
        )
      ],
      run: () => navigate(this.props.prevChallengePath)
    });
    this._editor.addAction({
      id: 'navigate-next',
      label: 'Navigate to next challenge',
      keybindings: [
        /* eslint-disable no-bitwise */
        monaco.KeyMod.chord(
          monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.PageUp
        )
      ],
      run: () => navigate(this.props.nextChallengePath)
    });
  };

  onChange = editorValue => {
    const { updateFile, fileKey } = this.props;
    updateFile({ key: fileKey, editorValue });
  };

  componentDidUpdate(prevProps) {
    if (this.props.dimensions !== prevProps.dimensions && this._editor) {
      this._editor.layout();
    }
  }

  render() {
    const { contents, ext, theme, fileKey } = this.props;
    const editorTheme = theme === 'night' ? 'vs-dark-custom' : 'vs-custom';
    return (
      <Suspense fallback={<Loader timeout={600} />}>
        <MonacoEditor
          editorDidMount={this.editorDidMount}
          editorWillMount={this.editorWillMount}
          key={`${editorTheme}-${fileKey}`}
          language={modeMap[ext]}
          onChange={this.onChange}
          options={this.options}
          theme={editorTheme}
          value={contents}
        />
      </Suspense>
    );
  }
}

Editor.displayName = 'Editor';
Editor.propTypes = propTypes;

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Editor);
