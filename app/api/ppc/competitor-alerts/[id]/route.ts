import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/databse/prisma";

// PATCH - Mark alert as resolved
export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const params = await props.params;
        const alertId = params.id;

        // Verify ownership
        const existingAlert = await prisma.ppcCompetitorAlert.findFirst({
            where: {
                id: alertId,
                userId,
            },
        });

        if (!existingAlert) {
            return NextResponse.json({ error: "Alert not found" }, { status: 404 });
        }

        const alert = await prisma.ppcCompetitorAlert.update({
            where: { id: alertId },
            data: { read: true },
        });

        return NextResponse.json({ alert });
    } catch (error) {
        console.error("Update competitor alert error:", error);
        return NextResponse.json(
            { error: "Failed to update alert" },
            { status: 500 }
        );
    }
}

// DELETE - Delete an alert
export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const params = await props.params;
        const alertId = params.id;

        // Verify ownership
        const existingAlert = await prisma.ppcCompetitorAlert.findFirst({
            where: {
                id: alertId,
                userId,
            },
        });

        if (!existingAlert) {
            return NextResponse.json({ error: "Alert not found" }, { status: 404 });
        }

        await prisma.ppcCompetitorAlert.delete({
            where: { id: alertId },
        });

        return NextResponse.json({ message: "Alert deleted successfully" });
    } catch (error) {
        console.error("Delete competitor alert error:", error);
        return NextResponse.json(
            { error: "Failed to delete alert" },
            { status: 500 }
        );
    }
}
