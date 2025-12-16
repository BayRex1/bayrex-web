import { Component } from 'react';
import { I_COPY } from '../UI/IconPack';
import { withTranslation } from 'react-i18next';
import { FormButton } from '../../UIKit';
import { errorReporter } from '../Services/ErrorReporter.js';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copiedToClipboard: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    console.error('Ошибка в приложении:', error, errorInfo);
    errorReporter.sendComponentError(error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  }

  copyErrorToClipboard = () => {
    const errorText = `${this.state.error ? this.state.error.toString() : ''}\n${this.state.errorInfo ? this.state.errorInfo.componentStack : ''}`;
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copiedToClipboard: true });
      setTimeout(() => {
        this.setState({ copiedToClipboard: false });
      }, 2000);
    });
  }

  render() {
    const { t } = this.props;

    if (this.state.hasError) {
      return (
        <div className="ErrorBoundary UI-Block">
          <div className="ErrorContainer UI-Block">
            <h1>{t('error_boundary_title')}</h1>
            <p>{t('error_boundary_description')}</p>
            <FormButton
              title={t('error_boundary_refresh')}
              onClick={this.handleRefresh}
            />
            <details className="ErrorDetails">
              <summary>{t('error_boundary_details')}</summary>
              <div className="ErrorContent">
                <pre>{this.state.error ? String(this.state.error) : ''}</pre>
                <pre>{this.state.errorInfo ? this.state.errorInfo.componentStack || '' : ''}</pre>
              </div>
              <button onClick={this.copyErrorToClipboard} className="CopyButton">
                <I_COPY />
                {this.state.copiedToClipboard ? t('error_boundary_copied') : t('error_boundary_copy')}
              </button>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary); 