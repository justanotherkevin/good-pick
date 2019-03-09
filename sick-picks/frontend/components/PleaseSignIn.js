import { Query } from 'react-apollo';
import { CURRENT_USER_QUERY } from '../gql/query';
import styled from 'styled-components';
import Signin from './Signin';

const SignInContainer = styled.div`
  max-width:  400px;
  width: 100%;
  margin: 0 auto;
`;

const PleaseSignIn = props => (
  <Query query={CURRENT_USER_QUERY}>
    {({ data, loading }) => {
      if (loading) return <p>Loading...</p>;
      if (!data.me) {
        return (
          <SignInContainer>
            <p>Please Sign In before Continuing</p>
            <Signin />
          </SignInContainer>
        );
      }
      return props.children;
    }}
  </Query>
);

export default PleaseSignIn;
