import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center px-4">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Página não encontrada</p>
        <p className="mb-6 text-sm text-muted-foreground">
          O endereço pode estar incorreto ou a página foi removida.
        </p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
