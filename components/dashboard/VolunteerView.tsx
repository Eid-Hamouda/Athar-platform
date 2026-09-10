"use client";

import Image from "next/image";
import {
  Truck,
  MapPin,
  Map as MapIcon,
  CheckCircle2,
  PhoneCall,
  MessageCircle,
  PackageCheck,
  ArrowDownToLine,
  History,
} from "lucide-react";

import { formatWhatsAppNumber, stripCoordinatesPrefix } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import {
  PageHeader,
  Surface,
  Toolbar,
  ActionChip,
} from "@/components/dashboard/ui/Layout";
import {
  DataTable,
  THead,
  TBody,
  TR,
  TH,
  TD,
  TableEmpty,
  CellStack,
} from "@/components/dashboard/ui/Table";
import { StatCard } from "@/components/dashboard/ui/Stat";

interface VolunteerViewProps {
  activeTab: string;
  /** Rows carry delivery fields that aren't on the base DonationItem type. */
  donations: any[];
  handleCompleteDelivery: (donationId: string) => void;
}

function mapsHref(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function VolunteerView({
  activeTab,
  donations,
  handleCompleteDelivery,
}: VolunteerViewProps) {
  const active = donations.filter((d) => d.status === "reserved");
  const completed = donations.filter((d) => d.status === "completed");

  /* ======================================================================== */
  /* Active tasks                                                             */
  /* ======================================================================== */
  if (activeTab === "volunteer-tasks") {
    return (
      <>
        <PageHeader
          title="المهام النشطة"
          description="كل مهمة تحتوي نقطة الاستلام وعنوان التسليم ورقم تواصل واحد — تُخفى بعد تأكيد التسليم."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="مهام نشطة"
            value={active.length}
            hint={active.length > 0 ? "تنتظر التنفيذ" : "لا شيء الآن"}
            icon={Truck}
            attention={active.length > 0}
          />
          <StatCard
            label="تسليم مكتمل"
            value={completed.length}
            hint="إجمالي سجلّك"
            icon={PackageCheck}
          />
          <StatCard
            label="إجمالي المهام"
            value={donations.length}
            hint="المسندة إليك"
            icon={CheckCircle2}
          />
        </div>

        {active.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={CheckCircle2}
            title="لا مهام مسندة إليك حالياً"
            body="ستظهر المهام القريبة منك هنا بمجرد أن يعيّنها فريق الإدارة."
          />
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {active.map((task) => {
              const pickup = stripCoordinatesPrefix(task.location);
              const dropoff = stripCoordinatesPrefix(task.delivery_location);

              return (
                <Surface
                  key={task.id}
                  flush
                  footer={
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-ink-700/65">
                        أكّد التسليم بعد تسليم القطعة للمستفيد فعلياً.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleCompleteDelivery(task.id)}
                      >
                        <CheckCircle2 size={15} />
                        أكّد إتمام التسليم
                      </Button>
                    </div>
                  }
                >
                  {/* Work-order header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-sand-200 px-5 py-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <Image
                        src={task.image_url || "/placeholder-item.svg"}
                        alt=""
                        width={44}
                        height={44}
                        className="h-11 w-11 shrink-0 rounded-md object-cover ring-1 ring-sand-200"
                      />
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-ink-900">
                          {task.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge variant="neutral">
                            {task.category}
                            {task.sub_category ? ` — ${task.sub_category}` : ""}
                          </Badge>
                          {task.condition && (
                            <Badge variant="gold">{task.condition}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>

                  {/* Route */}
                  <div className="grid sm:grid-cols-2">
                    <div className="border-b border-sand-200 px-5 py-4 sm:border-b-0">
                      <p className="flex items-center gap-2 text-xs font-bold text-ink-700/70">
                        <ArrowDownToLine size={14} className="text-brand-600" />
                        ١ · الاستلام من المتبرّع
                      </p>
                      <p className="mt-2 text-sm text-ink-800">
                        {task.location || "غير محدد"}
                      </p>
                      {pickup && (
                        <ActionChip
                          href={mapsHref(pickup)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex w-fit"
                        >
                          <MapIcon size={12} className="text-brand-600" />
                          افتح في الخرائط
                        </ActionChip>
                      )}
                    </div>

                    {/* border-s faces the previous column under dir="rtl" */}
                    <div className="px-5 py-4 sm:border-s sm:border-sand-200">
                      <p className="flex items-center gap-2 text-xs font-bold text-ink-700/70">
                        <MapPin size={14} className="text-brand-600" />
                        ٢ · التسليم للمستفيد
                      </p>
                      <p className="mt-2 text-sm text-ink-800">
                        {task.delivery_address || "لم يُحدَّد عنوان التوصيل"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {dropoff && (
                          <ActionChip
                            href={mapsHref(dropoff)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MapIcon size={12} className="text-brand-600" />
                            الخرائط
                          </ActionChip>
                        )}
                        {task.contact_phone && (
                          <>
                            <ActionChip
                              tone="dark"
                              href={`tel:${task.contact_phone}`}
                            >
                              <PhoneCall size={12} />
                              اتصال
                            </ActionChip>
                            <ActionChip
                              tone="whatsapp"
                              href={formatWhatsAppNumber(task.contact_phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle size={12} />
                              واتساب
                            </ActionChip>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Surface>
              );
            })}
          </div>
        )}
      </>
    );
  }

  /* ======================================================================== */
  /* Delivery history                                                         */
  /* ======================================================================== */
  if (activeTab === "volunteer-history") {
    return (
      <>
        <PageHeader
          title="سجل التسليمات"
          description="المهام التي أتممتها. يبقى السجل متاحاً لتوثيق ساعاتك التطوعية."
        />

        <Surface flush>
          <Toolbar>
            <span className="text-xs text-ink-700/60">
              {completed.length} تسليم مكتمل
            </span>
          </Toolbar>

          <DataTable minWidth="46rem">
            <THead>
              <TR>
                <TH>القطعة</TH>
                <TH>الفئة</TH>
                <TH>عنوان التسليم</TH>
                <TH justify="end">الحالة</TH>
              </TR>
            </THead>
            <TBody>
              {completed.length === 0 ? (
                <TableEmpty
                  colSpan={4}
                  icon={History}
                  title="لا تسليمات بعد"
                  body="ستُسجَّل كل مهمة تؤكّد تسليمها هنا تلقائياً."
                />
              ) : (
                completed.map((task) => (
                  <TR key={task.id}>
                    <TD>
                      <CellStack
                        media={
                          <Image
                            src={task.image_url || "/placeholder-item.svg"}
                            alt=""
                            width={36}
                            height={36}
                            className="h-9 w-9 shrink-0 rounded-md object-cover ring-1 ring-sand-200"
                          />
                        }
                        primary={task.title}
                        secondary={task.sub_category}
                      />
                    </TD>
                    <TD className="text-ink-700/80">{task.category}</TD>
                    <TD className="max-w-64 truncate text-ink-700/80">
                      {task.delivery_address || "—"}
                    </TD>
                    <TD justify="end">
                      <StatusBadge status={task.status} />
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </DataTable>
        </Surface>
      </>
    );
  }

  return null;
}
