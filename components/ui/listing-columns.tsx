import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "./checkbox";
import { Button } from "./button";
import { ImageOff, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu";

export type ListingRow = {
  id: string;
  title: string;
  version: number;
  finalized: boolean;
  updatedAt: string;
  asin?: string;
  imageUrl?: string;
};

export const listingColumns: ColumnDef<ListingRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Select row ${row.index + 1}`}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 32,
    maxSize: 32,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 p-0">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem>Link Listing</DropdownMenuItem>
          <DropdownMenuItem>Export as CSV</DropdownMenuItem>
          <DropdownMenuItem>View versions</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 48,
    maxSize: 48,
  },
  {
    id: "product",
    header: "Product",
    cell: ({ row }) => (
      <div className="flex items-center gap-3 min-w-0 max-w-full">
        {row.original.imageUrl ? (
          <img
            src={row.original.imageUrl}
            alt={row.original.title}
            className="w-12 h-12 object-cover rounded-md border bg-white flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 flex items-center justify-center rounded-md border bg-muted text-muted-foreground flex-shrink-0">
            <ImageOff className="w-6 h-6" />
          </div>
        )}
        <div className="flex flex-col min-w-0 max-w-xs">
          <span
            className="font-medium whitespace-normal wrap-break-word leading-tight block"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              wordBreak: "break-word",
              maxWidth: 240,
            }}
          >
            {row.original.title || (
              <span className="text-muted-foreground">(Untitled)</span>
            )}
          </span>
          {row.original.asin && (
            <span
              className="text-xs text-muted-foreground truncate block"
              style={{ maxWidth: 240 }}
            >
              {row.original.asin}
            </span>
          )}
        </div>
      </div>
    ),
    minSize: 200,
    size: 320,
    maxSize: 400,
  },
  {
    accessorKey: "version",
    header: "Version",
    cell: ({ row }) => `v${row.original.version}`,
    size: 48,
    maxSize: 64,
  },
  {
    accessorKey: "finalized",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
          row.original.finalized
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {row.original.finalized ? "Finalized" : "Draft"}
      </span>
    ),
    size: 80,
    maxSize: 100,
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => row.original.updatedAt,
    size: 120,
    maxSize: 160,
  },
  {
    id: "edit",
    header: "Edit",
    cell: ({ row }) => (
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          (window.location.href = `/dashboard/listing/builder?id=${row.original.id}`)
        }
      >
        Edit
      </Button>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 56,
    maxSize: 64,
  },
];
