import { describe, expect, it } from 'vitest';
import { comparePendingThenDate } from '../recordSort';

type TestItem = {
  id: string;
  date?: string;
  createdAt?: string;
  done: boolean;
};

const getSortDate = (item: TestItem) => item.date ?? '';
const isPending = (item: TestItem) => !item.done;

const sort = (items: TestItem[]) =>
  [...items].sort((a, b) => comparePendingThenDate(a, b, isPending, getSortDate));

describe('comparePendingThenDate', () => {
  it('coloca pendentes antes de concluídos', () => {
    const items: TestItem[] = [
      { id: '1', date: '2026-07-01', done: true },
      { id: '2', date: '2026-07-02', done: false },
      { id: '3', date: '2026-07-03', done: true },
      { id: '4', date: '2026-07-04', done: false },
    ];

    expect(sort(items).map((i) => i.id)).toEqual(['4', '2', '3', '1']);
  });

  it('ordena por data descendente dentro do mesmo grupo', () => {
    const items: TestItem[] = [
      { id: '1', date: '2026-07-01', done: false },
      { id: '2', date: '2026-07-05', done: false },
      { id: '3', date: '2026-07-03', done: false },
    ];

    expect(sort(items).map((i) => i.id)).toEqual(['2', '3', '1']);
  });

  it('usa createdAt como desempate quando datas são iguais', () => {
    const items: TestItem[] = [
      { id: '1', date: '2026-07-01', createdAt: '2026-07-01T08:00:00Z', done: false },
      { id: '2', date: '2026-07-01', createdAt: '2026-07-01T12:00:00Z', done: false },
      { id: '3', date: '2026-07-01', createdAt: '2026-07-01T10:00:00Z', done: false },
    ];

    expect(sort(items).map((i) => i.id)).toEqual(['2', '3', '1']);
  });
});
