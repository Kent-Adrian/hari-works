import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { KPIS, MTD_SCALE, TOP_SKUS, formatNumber, formatPeso, type BranchId } from "@/lib/mock-data"

export function TopSkus({ branchIds }: { branchIds: BranchId[] }) {
  // Scale consolidated SKU volumes to the selected branches' share of month-to-date sales
  const mtd = (ids: BranchId[]) => ids.reduce((a, id) => a + KPIS[id].mtdSales, 0)
  const share = (mtd(branchIds) / mtd(Object.keys(KPIS) as BranchId[])) * MTD_SCALE

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top products</CardTitle>
        <CardDescription>Month to date · margin uses inventory cost, not selling price</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Product</TableHead>
              <TableHead>Packaging</TableHead>
              <TableHead className="text-right">Sacks sold</TableHead>
              <TableHead className="text-right">Sales</TableHead>
              <TableHead className="text-right">Avg cost / sack</TableHead>
              <TableHead className="pr-4 text-right">Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="tabular-nums">
            {TOP_SKUS.map((s) => (
              <TableRow key={s.sku}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium">
                        {s.formulation} {s.brand}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">{s.sku}</div>
                    </div>
                    {s.rebagged && <Badge variant="secondary">Rebagged</Badge>}
                  </div>
                </TableCell>
                <TableCell>{s.packaging}</TableCell>
                <TableCell className="text-right">{formatNumber(Math.round(s.sacks * share))}</TableCell>
                <TableCell className="text-right">{formatPeso(Math.round(s.sacks * share) * s.price)}</TableCell>
                <TableCell className="text-right">{formatPeso(s.avgCost)}</TableCell>
                <TableCell className="pr-4 text-right">{(((s.price - s.avgCost) / s.price) * 100).toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
