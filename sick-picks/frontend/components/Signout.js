import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { CURRENT_USER_QUERY } from '../gql/query';
import { SIGN_OUT_MUTATION } from '../gql/mutation';

const Signout = props => (
  <Mutation
    mutation={SIGN_OUT_MUTATION}
    refetchQueries={[{ query: CURRENT_USER_QUERY }]}
  >
    {signout => <button onClick={signout}>Sign Out</button>}
  </Mutation>
);
export default Signout;
