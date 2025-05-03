import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CompetitionResult } from '@/types/api';

interface ResultsTableProps {
  results: CompetitionResult[];
}

export const ResultsTable = ({ results }: ResultsTableProps) => {
  if (!results || results.length === 0) {
    return <p className="text-center py-8">Результаты еще не опубликованы.</p>;
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Место</TableHead>
            <TableHead>Участник</TableHead>
            <TableHead className="text-right">Результат</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.user_id}>
              <TableCell className="font-medium">{result.rank}</TableCell>
              <TableCell>
                {result.first_name} {result.last_name}
                {result.username && <span className="ml-2 text-gray-500">@{result.username}</span>}
              </TableCell>
              <TableCell className="text-right">{result.result_value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}; 