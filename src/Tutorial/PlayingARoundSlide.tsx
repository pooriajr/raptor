import { HandDisplay } from "../PlayerArea/Hand";
import { CARDS } from "@/data/cards";
import { CardResolutionDisplay, EffectContent, ActionPointsContent } from "../CardResolution";

function RoundStep({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 items-start p-3 bg-white/[0.03] rounded-lg">
      <div className="w-9 h-9 bg-[linear-gradient(145deg,#4a8a4a,#2a6a2a)] text-white/80 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <h4 className="m-0 mb-1 text-lg text-white">{title}</h4>
        <p className="my-1 text-sm text-white/80">{description}</p>
        {children}
      </div>
    </div>
  );
}

function Scribble({ children, scientist }: { children: React.ReactNode; scientist?: boolean }) {
  return (
    <div
      className={`font-[Caveat] text-[1.8rem] max-w-[300px] leading-tight rotate-2 -ml-4 ${scientist ? "text-[#ffcc80]" : "text-[#90ee90]"}`}
    >
      {children}
    </div>
  );
}

function PlayingARoundSlide() {
  return (
    <div className="flex flex-col gap-4">
      <RoundStep
        number={1}
        title="Select a Card in Secret"
        description="Both players secretly choose a card from their hand of 3 (numbered 1-9)."
      >
        <div className="flex justify-around gap-12 py-8 px-4">
          <HandDisplay
            player="raptor"
            cards={[CARDS.raptor_3_fear, CARDS.raptor_5_recovery, CARDS.raptor_8_fear]}
            selectedCardId="raptor_3_fear"
            static
            faceUp={false}
          />
          <HandDisplay
            player="scientist"
            cards={[CARDS.scientist_2_reinforcements, CARDS.scientist_6_reinforcements, CARDS.scientist_9_none]}
            selectedCardId="scientist_6_reinforcements"
            static
            faceUp={false}
          />
        </div>
      </RoundStep>

      <RoundStep
        number={2}
        title="Reveal Cards"
        description="Both cards are revealed and compared. If tied, the round ends immediately with no effects."
      >
        <div className="flex justify-center gap-12 py-8 px-4">
          <HandDisplay player="raptor" cards={[CARDS.raptor_3_fear]} static />
          <HandDisplay player="scientist" cards={[CARDS.scientist_6_reinforcements]} static />
        </div>
      </RoundStep>

      <RoundStep
        number={3}
        title="Effect Phase"
        description={
          <>
            The player with the <strong>lower</strong> card uses that card's special effect.
          </>
        }
      >
        <div className="flex items-center justify-center gap-6 py-4">
          <HandDisplay player="raptor" cards={[CARDS.raptor_3_fear]} static />
          <CardResolutionDisplay
            raptorContent={<EffectContent card={CARDS.raptor_3_fear} />}
            scientistContent={<ActionPointsContent actionPoints={3} animate={false} />}
            raptorState="active"
            scientistState="done"
            static
          />
          <Scribble>("FEAR" lets Raptor disable 1 scientist piece)</Scribble>
        </div>
      </RoundStep>

      <RoundStep
        number={4}
        title="Action Phase"
        description={
          <>
            The player with the <strong>higher</strong> card gets action points equal to the difference between the
            cards.
          </>
        }
      >
        <div className="flex items-center justify-center gap-6 py-4">
          <HandDisplay player="scientist" cards={[CARDS.scientist_6_reinforcements]} static />
          <CardResolutionDisplay
            raptorContent={<EffectContent card={CARDS.raptor_3_fear} />}
            scientistContent={<ActionPointsContent actionPoints={3} animate={false} />}
            raptorState="done"
            scientistState="active"
            static
          />
          <Scribble scientist>(6 − 3 = 3 action points to move, shoot, capture, etc.)</Scribble>
        </div>
      </RoundStep>

      <RoundStep
        number={5}
        title="Round End"
        description="Both played cards are discarded. Players draw back to 3 cards. A new round begins."
      />
    </div>
  );
}

export default PlayingARoundSlide;
