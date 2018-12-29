import Reset from '../components/Reset';

const ResetPasswordPage = props => (
  <div>
    <p>reset page {props.query.resetToken}</p>
    <Reset resetToken={props.query.resetToken} />
  </div>
);

export default ResetPasswordPage;
