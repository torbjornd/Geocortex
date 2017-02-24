/// <reference path="../../../Libs/Framework.d.ts" />
/// <reference path="../../../Libs/Mapping.Infrastructure.d.ts" />

module ediFeatureVertices {

    export class EditFeatureVertices extends geocortex.framework.application.ModuleBase {

        app: geocortex.essentialsHtmlViewer.ViewerApplication;
        featureSetJson: esri.tasks.FeatureSet;
        featureName: string;
        

        constructor(app: geocortex.essentialsHtmlViewer.ViewerApplication, lib: string) {
            super(app, lib);
        }

        initialize(config: any): void {
            var _this = this;
            this.app.registerActivityIdHandler("StartEditingInWorkflow", dojo.hitch(this, this.startEditingInWorkflow));
            this.app.commandRegistry.command("StartEditingInWorkflow").register(this, this.startEditingInWorkflow);
        }
        
        // Starter redigering og behandler resulteter
        startEditingInWorkflow(context: geocortex.workflow.ActivityContext): void {
            var esriFeatureSet = context.getValue("featureSet");
            var inspFeatureLayerName: string = context.getValue("layerName");
            var featureServiceUrl:string = context.getValue("featureServiceURL");
            this.app.commandRegistry.command("RemoveHighlightLayer").execute("defaultHighlightLayer");

            var esriFeatureLayer:esri.layers.FeatureLayer = Utilities.getFeatureLayer(inspFeatureLayerName, featureServiceUrl, this.app.site);
            
            esriFeatureSet.features[0].attributes["OBJECTID"] = parseInt(esriFeatureSet.features[0].attributes["OBJECTID"], 10);
            var esriFeature: esri.Graphic = esriFeatureSet.features[0];
            var symbol = new esri.symbol.SimpleFillSymbol();
            symbol.setColor(new esri.Color([255, 0, 0]));
            esriFeature.setSymbol(symbol);
            if (esriFeature && esriFeatureLayer) {
                
                // Starts geometry editing on selected feature
                this.app.commandRegistry.command("StartEditingGraphicGeometry").execute(esriFeature, esriFeatureLayer);

                // Listen for event 'GeometryEditCompletedEvent'
                this.app.eventRegistry.event("GeometryEditCompletedEvent").subscribe(this,(eventArgs: geocortex.essentialsHtmlViewer.mapping.infrastructure.eventArgs.GeometryEditCompletedEventArg) => {
                    if (esriFeature && esriFeature === eventArgs.originalGraphic) {
                        context.setValue("EditedGeometry", eventArgs.editedGraphic.geometry);
                        context.setValue("Success", true);
                        
                    } else {
                        context.setValue("Success", false);
                    }
                    context.completeActivity();
                });
            } else {
                context.setValue("Success", false);
                context.completeActivity();
            }
        }
    }
    
    /**
     * Several useful methods
     */
    class Utilities {
        
        /** Finds the featurelayer to be edited
         * 
         * @param featurelayerName Name of the featurelayer
         * @param featureServiceUrl URL of the featureservice
         * @param site Geocortex Site
         */
        static getFeatureLayer(featurelayerName: string, featureServiceUrl: string, site: geocortex.essentials.Site): esri.layers.FeatureLayer {
            var featureLayer: esri.layers.FeatureLayer = new esri.layers.FeatureLayer(featureServiceUrl);
            featureLayer.setVisibility(true);
            var map = site.getMap();
            var layers = new Array<esri.layers.Layer>();
            layers.push(featureLayer);
            site.essentialsMap.addServiceLayers(layers, "Operational");
            
            return featureLayer;
        }
    }
}