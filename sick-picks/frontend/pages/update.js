import UpdateItem from '../components/UpdateItem';

const UpdatePage = ({ query }) => (
  <div>
    <UpdateItem id={query.id} />
  </div>
);

export default UpdatePage;
