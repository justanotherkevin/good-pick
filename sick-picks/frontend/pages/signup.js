import Signup from '../components/Signup';
import styled from 'styled-components';
import Signin from '../components/Signin';
import RequestRest from '../components/RequestReset';

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: 20px;
`;

const SignupPage = props => (
  <Columns>
    <Signup />
    <Signin />
    <RequestRest />
  </Columns>
);

export default SignupPage;
